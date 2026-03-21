const CollaborationRequest = require('../models/CollaborationRequest');
const Enrollment = require('../models/Enrollment');

// @desc    Create a new collaboration request
// @route   POST /api/collaborations/request
// @access  Private (Student)
const createRequest = async (req, res) => {
    try {
        const { task_id, course_id, requested_peer } = req.body;
        const requester = req.user._id;

        if (!task_id || !course_id || !requested_peer) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (requester.toString() === requested_peer) {
            return res.status(400).json({ message: 'You cannot invite yourself' });
        }

        // Verify that requested peer is enrolled in the course
        const isEnrolled = await Enrollment.findOne({ course_id, student_id: requested_peer, status: { $in: ['ACTIVE', 'APPROVED']} });
        if (!isEnrolled) {
            return res.status(400).json({ message: 'Requested peer is not active in this course' });
        }

        // Check if request already exists
        const existing = await CollaborationRequest.findOne({
            task_id,
            requester,
            requested_peer,
            status: 'PENDING'
        });

        if (existing) {
            return res.status(400).json({ message: 'You already sent a request to this peer for this task' });
        }

        const newRequest = await CollaborationRequest.create({
            task_id,
            course_id,
            requester,
            requested_peer
        });

        res.status(201).json(newRequest);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Collaboration request already exists' });
        }
        res.status(500).json({ message: 'Failed to create collaboration request' });
    }
};

// @desc    Get pending incoming & outgoing requests for the logged-in user
// @route   GET /api/collaborations/me
// @access  Private
const getMyRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const incoming = await CollaborationRequest.find({ requested_peer: userId, status: 'PENDING' })
            .populate('requester', 'name email')
            .populate('task_id', 'task_name allow_collaboration')
            .populate('course_id', 'course_name course_code');

        const outgoing = await CollaborationRequest.find({ requester: userId })
            .populate('requested_peer', 'name email')
            .populate('task_id', 'task_name')
            .populate('course_id', 'course_name course_code');

        res.json({ incoming, outgoing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch collaboration requests' });
    }
};

// @desc    Respond to an incoming request (Accept/Reject)
// @route   PUT /api/collaborations/:id/respond
// @access  Private
const respondToRequest = async (req, res) => {
    try {
        const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
        const requestId = req.params.id;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        const collabRequest = await CollaborationRequest.findById(requestId);
        
        if (!collabRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Verify the user is the requested peer
        if (collabRequest.requested_peer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to respond to this request' });
        }

        collabRequest.status = status;
        await collabRequest.save();

        res.json(collabRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update collaboration request' });
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    respondToRequest
};
