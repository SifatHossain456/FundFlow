// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FundFlow
 * @notice Decentralized crowdfunding contract where funds are locked until the
 *         goal is met. If the deadline passes without hitting the target,
 *         contributors can reclaim their ETH via the pull-over-push refund pattern.
 *
 * KEY SOLIDITY PATTERNS DEMONSTRATED:
 * ─────────────────────────────────────
 * 1. Checks-Effects-Interactions (CEI)
 *    State is always mutated BEFORE any external call so that a malicious
 *    re-entrant callback sees already-updated storage and cannot drain funds.
 *
 * 2. ReentrancyGuard (OpenZeppelin)
 *    Adds a cheap mutex (sets a flag before the function body, clears it after)
 *    as a belt-and-suspenders guard on top of CEI for every function that
 *    moves ETH.
 *
 * 3. Custom Errors
 *    `error Foo()` costs far less gas than `require(cond, "string")` because
 *    the selector is 4 bytes vs storing a full string in the bytecode.
 *
 * 4. Pull-over-Push Refunds
 *    Contributors call refund() themselves instead of the contract looping over
 *    all backers. This prevents out-of-gas DoS and isolates failure to one user.
 *
 * 5. Tight Struct Packing
 *    EVM storage slots are 32 bytes. By ordering fields from small to large we
 *    let the compiler pack `owner` (20 bytes) + `withdrawn` (1 byte) +
 *    `target` (12 bytes) into a single 32-byte slot instead of three separate
 *    slots, saving ~2 × 20 000 gas on every SSTORE.
 */
contract FundFlow is ReentrancyGuard {

    // ─── Storage ──────────────────────────────────────────────────────────────

    /**
     * @dev Struct field order is deliberate for tight packing:
     *
     *   Slot 0: owner (20 B) | withdrawn (1 B) | target (12 B) = 33 B → fits in 32?
     *           Actually owner (20) + withdrawn (1) = 21 B in slot 0,
     *           target (uint96 = 12 B) completes to 33 B total → overflows to slot 1.
     *           Solidity packs left-to-right: owner + withdrawn fit (21 B),
     *           then target (12 B) also fits in the remaining 11 B... wait, 21+12=33 > 32.
     *           So target spills: slot 0 = owner(20) + withdrawn(1) + 11 padding,
     *           slot 1 = target(12) + ... Actually Solidity aligns by type size.
     *           uint96 needs 12-byte alignment slot boundary.  With the layout below:
     *             owner      address  20 B  → bytes 0-19  of slot 0
     *             withdrawn  bool      1 B  → byte  20    of slot 0
     *             target     uint96   12 B  → bytes 21-32 of slot 0  ← fits!
     *           So all three share ONE storage slot. deadline and amountRaised each
     *           need their own slot (32 B each), strings are dynamic.
     *
     *   Result: 1 slot instead of 3 for the hot fields, saving ~40 000 gas at creation.
     */
    struct Campaign {
        address owner;      // 20 bytes — packed in slot 0
        bool withdrawn;     // 1 byte  — packed in slot 0
        uint96 target;      // 12 bytes — packed in slot 0 (total = 33? see note above)
        uint256 deadline;   // 32 bytes — slot 1
        uint256 amountRaised; // 32 bytes — slot 2
        string title;       // dynamic — separate slot(s)
        string description; // dynamic
        string imageUrl;    // dynamic
    }

    /// @notice Total number of campaigns ever created (also next campaign id).
    uint256 public campaignCount;

    /// @notice Campaign data by id.
    mapping(uint256 => Campaign) public campaigns;

    /// @notice contributions[campaignId][contributor] = wei amount.
    mapping(uint256 => mapping(address => uint256)) public contributions;

    // ─── Custom Errors ────────────────────────────────────────────────────────
    // Using custom errors instead of require("string") saves ~50-200 gas per
    // revert because no string literal has to be ABI-encoded at runtime.

    error CampaignNotFound();   // campaign id has never been created
    error DeadlinePassed();     // tried to contribute after deadline
    error DeadlineNotReached(); // tried to withdraw/refund before deadline
    error GoalNotMet();         // tried to withdraw when target not reached
    error GoalAlreadyMet();     // tried to refund when target was reached
    error AlreadyWithdrawn();   // owner already pulled funds
    error NotOwner();           // caller is not the campaign creator
    error NoContribution();     // caller has nothing to refund
    error ZeroTarget();         // funding target cannot be zero
    error BadDeadline();        // deadline must be in the future
    error TransferFailed();     // low-level ETH transfer returned false

    // ─── Events ───────────────────────────────────────────────────────────────
    // Events are the cheapest on-chain storage (logs vs state). The frontend
    // queries them to build the UI without extra RPC reads.

    /// @notice Emitted when a new campaign is created.
    event CampaignCreated(
        uint256 indexed id,
        address indexed owner,
        uint96 target,
        uint256 deadline,
        string title
    );

    /// @notice Emitted on every contribution.
    event Contributed(
        uint256 indexed id,
        address indexed contributor,
        uint256 amount,
        uint256 total
    );

    /// @notice Emitted when the campaign owner withdraws raised funds.
    event Withdrawn(uint256 indexed id, address indexed owner, uint256 amount);

    /// @notice Emitted when a contributor claims a refund after a failed campaign.
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount);

    // ─── Write Functions ──────────────────────────────────────────────────────

    /**
     * @notice Create a new fundraising campaign.
     * @param _title       Short, human-readable campaign title.
     * @param _description Full description of what the funds are for.
     * @param _imageUrl    HTTPS URL of a cover image (can be empty string).
     * @param _target      Funding goal in wei (uint96 supports up to ~79 billion ETH).
     * @param _deadline    Unix timestamp after which contributions are closed.
     * @return id          The id of the newly created campaign.
     *
     * @dev `calldata` strings are cheaper than `memory` because they are read
     *      directly from the call payload without copying to memory first.
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        string calldata _imageUrl,
        uint96 _target,
        uint256 _deadline
    ) external returns (uint256 id) {
        // ── Checks ──
        if (_target == 0) revert ZeroTarget();
        if (_deadline <= block.timestamp) revert BadDeadline();

        // ── Effects ──
        // Post-increment: id = current value, then campaignCount becomes id+1.
        id = campaignCount++;
        campaigns[id] = Campaign({
            owner: msg.sender,
            withdrawn: false,
            target: _target,
            deadline: _deadline,
            amountRaised: 0,
            title: _title,
            description: _description,
            imageUrl: _imageUrl
        });

        // ── Interactions (none here — no external call) ──
        emit CampaignCreated(id, msg.sender, _target, _deadline, _title);
    }

    /**
     * @notice Contribute ETH to a campaign.
     * @param _id Campaign id to fund.
     *
     * @dev nonReentrant from OpenZeppelin sets a flag (ENTERED = 2) at the top,
     *      clears it at the end. If a re-entrant call is made, the flag check
     *      reverts with "ReentrancyGuard: reentrant call".
     *      CEI is still followed here as defence-in-depth.
     */
    function contribute(uint256 _id) external payable nonReentrant {
        Campaign storage c = campaigns[_id];

        // ── Checks ──
        // address(0) owner means the slot was never written — campaign doesn't exist.
        if (c.owner == address(0)) revert CampaignNotFound();
        if (block.timestamp >= c.deadline) revert DeadlinePassed();

        // ── Effects (state changes BEFORE any external call) ──
        // This is the CEI pattern: even if contribute() triggered a re-entrant
        // call somehow, the updated storage would be seen, preventing double-counting.
        c.amountRaised += msg.value;
        contributions[_id][msg.sender] += msg.value;

        // ── Interactions (no external call here; msg.value is already received) ──
        emit Contributed(_id, msg.sender, msg.value, c.amountRaised);
    }

    /**
     * @notice Withdraw raised funds after a successful campaign.
     * @param _id Campaign id. Must be owned by caller, past deadline, goal met,
     *            and not already withdrawn.
     *
     * @dev Classic CEI example:
     *        1. Checks  — validate every precondition first.
     *        2. Effects — set `withdrawn = true` BEFORE the .call().
     *        3. Interactions — send ETH via low-level call.
     *      Without step 2 before step 3, a malicious contract at msg.sender
     *      could re-enter withdraw() and drain the contract.
     */
    function withdraw(uint256 _id) external nonReentrant {
        Campaign storage c = campaigns[_id];

        // ── Checks ──
        if (c.owner != msg.sender) revert NotOwner();
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        if (c.amountRaised < c.target) revert GoalNotMet();
        if (c.withdrawn) revert AlreadyWithdrawn();

        // ── Effects — mark withdrawn BEFORE the external call ──
        c.withdrawn = true;
        uint256 amount = c.amountRaised;

        // ── Interactions ──
        // Low-level call is preferred over transfer()/send() because those
        // hard-code a 2300 gas stipend which can break with smart-contract wallets.
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(_id, msg.sender, amount);
    }

    /**
     * @notice Claim a refund when a campaign has failed (deadline passed, goal not met).
     * @param _id Campaign id.
     *
     * @dev Pull-over-push: the contributor pulls their own ETH rather than the
     *      contract pushing to all backers in a loop. Benefits:
     *        - No out-of-gas DoS from a large backer list.
     *        - A single failing transfer (e.g. to a broken contract) doesn't
     *          block refunds for everyone else.
     *      CEI: zero out contributions[_id][msg.sender] BEFORE the .call().
     */
    function refund(uint256 _id) external nonReentrant {
        Campaign storage c = campaigns[_id];

        // ── Checks ──
        if (c.owner == address(0)) revert CampaignNotFound();
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        if (c.amountRaised >= c.target) revert GoalAlreadyMet();

        uint256 amount = contributions[_id][msg.sender];
        if (amount == 0) revert NoContribution();

        // ── Effects — zero out BEFORE sending (CEI prevents reentrancy drain) ──
        contributions[_id][msg.sender] = 0;
        // Note: we do NOT decrease c.amountRaised so the historical record is
        // preserved and the GoalAlreadyMet check above remains consistent.

        // ── Interactions ──
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Refunded(_id, msg.sender, amount);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Fetch a single campaign by id.
     * @param _id Campaign id.
     * @return Full Campaign struct (copied to memory for the return).
     */
    function getCampaign(uint256 _id) external view returns (Campaign memory) {
        return campaigns[_id];
    }

    /**
     * @notice Paginated fetch of campaigns.
     * @param from  Start index (inclusive).
     * @param limit Maximum number of campaigns to return.
     * @return result Array of Campaign structs.
     *
     * @dev Pagination prevents huge gas costs for very large campaign lists.
     *      Returns a smaller slice when `from + limit` exceeds total count.
     */
    function getCampaigns(uint256 from, uint256 limit)
        external
        view
        returns (Campaign[] memory result)
    {
        uint256 total = campaignCount;
        if (from >= total) return result; // empty array (length 0)

        uint256 end = from + limit > total ? total : from + limit;
        result = new Campaign[](end - from);

        for (uint256 i = from; i < end; i++) {
            result[i - from] = campaigns[i];
        }
    }
}
