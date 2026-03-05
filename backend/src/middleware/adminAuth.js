import User from "../models/userModel.js";

export const adminProtect = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authorized. No user found." });
        }

        const user = await User.findById(req.user.id);
        const isAdmin = user && (user.role === "admin" || user.email === 'simsekfarukkemal@gmail.com' || user.email === 'ercanemre1108@gmail.com');
        if (isAdmin) {
            next();
        } else {
            return res.status(403).json({ success: false, message: "Admin yetkisi bulunamadı." });
        }
    } catch (error) {
        console.error("Admin Auth Middleware Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
