import jwt from 'jsonwebtoken'

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    console.log('authHeader from server', authHeader)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({
            isSuccess: false,
            message: 'Unauthorized'
        })
    };

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.decodedEmail = decoded.email;

        next();
    } catch (error) {
        res.status(500).send({
            isSuccess: false,
            message: error.message
        })
    }
    // const token = req.headers.authorization.split(' ')[1] || req.headers.Authorization.split(' ')[1];
}