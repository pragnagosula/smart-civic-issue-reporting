const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const issueRoutes = require('./routes/issueRoutes');
const officerRoutes = require('./routes/officerRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Start SLA & Deadline Background Tasks
    const { checkSLAAndReassign } = require('./services/assignmentService');
    const { checkResolutionDeadlines } = require('./services/cronService');

    setInterval(() => {
        checkSLAAndReassign();
        checkResolutionDeadlines();
    }, 60 * 1000); // 1 minute
});
