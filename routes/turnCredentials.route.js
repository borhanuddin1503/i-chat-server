import { Router } from "express";


const router = Router();

router.get('/', async (req, res) => {
    try {
        const response = await fetch(process.env.TURN_API);
        const iceServers = await response.json();
        res.json({ isSuccess: true, data: iceServers });
    } catch (error) {
        console.error('Error fetching TURN credentials:', error);
        res.status(500).json({ isSuccess: false, error: 'Failed to fetch TURN credentials' });
    }
});


export default router;