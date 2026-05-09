/**
 * AVENA - Role Check Middleware
 * middleware/roleCheck.js
 */

const db = require('../config/db');

/**
 * Vérifie si l'utilisateur a le rôle requis
 */
const hasRole = (roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Non authentifié' });
            }

            const result = await db.query(
                `SELECT role FROM users WHERE id = $1`,
                [userId]
            );

            const userRole = result.rows[0]?.role || 'user';
            
            if (!roles.includes(userRole) && !roles.includes('super_admin')) {
                return res.status(403).json({ ok: false, error: 'Accès non autorisé' });
            }

            next();
        } catch (error) {
            console.error('[RoleCheck] Error:', error);
            res.status(500).json({ ok: false, error: 'Erreur serveur' });
        }
    };
};

/**
 * Vérifie si l'utilisateur est admin
 */
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ ok: false, error: 'Non authentifié' });
        }

        const result = await db.query(
            `SELECT role FROM users WHERE id = $1`,
            [userId]
        );

        const userRole = result.rows[0]?.role || 'user';
        
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ ok: false, error: 'Accès administrateur requis' });
        }

        next();
    } catch (error) {
        console.error('[IsAdmin] Error:', error);
        res.status(500).json({ ok: false, error: 'Erreur serveur' });
    }
};

/**
 * Vérifie si l'utilisateur est super admin
 */
const isSuperAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ ok: false, error: 'Non authentifié' });
        }

        const result = await db.query(
            `SELECT role FROM users WHERE id = $1`,
            [userId]
        );

        const userRole = result.rows[0]?.role || 'user';
        
        if (userRole !== 'super_admin') {
            return res.status(403).json({ ok: false, error: 'Accès super administrateur requis' });
        }

        next();
    } catch (error) {
        console.error('[IsSuperAdmin] Error:', error);
        res.status(500).json({ ok: false, error: 'Erreur serveur' });
    }
};

/**
 * Vérifie si l'utilisateur est vendeur
 */
const isSeller = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ ok: false, error: 'Non authentifié' });
        }

        const result = await db.query(
            `SELECT role FROM users WHERE id = $1`,
            [userId]
        );

        const userRole = result.rows[0]?.role || 'user';
        
        if (userRole !== 'seller' && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ ok: false, error: 'Accès vendeur requis' });
        }

        next();
    } catch (error) {
        console.error('[IsSeller] Error:', error);
        res.status(500).json({ ok: false, error: 'Erreur serveur' });
    }
};

/**
 * Vérifie la propriété d'un produit
 */
const isProductOwner = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const productId = req.params.id;

        if (!userId) {
            return res.status(401).json({ ok: false, error: 'Non authentifié' });
        }

        const result = await db.query(
            `SELECT seller_id FROM products WHERE id = $1`,
            [productId]
        );

        const product = result.rows[0];
        
        if (!product) {
            return res.status(404).json({ ok: false, error: 'Produit non trouvé' });
        }

        const userResult = await db.query(
            `SELECT role FROM users WHERE id = $1`,
            [userId]
        );

        const userRole = userResult.rows[0]?.role || 'user';
        
        if (product.seller_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ ok: false, error: 'Vous n\'êtes pas le propriétaire de ce produit' });
        }

        next();
    } catch (error) {
        console.error('[IsProductOwner] Error:', error);
        res.status(500).json({ ok: false, error: 'Erreur serveur' });
    }
};

module.exports = {
    hasRole,
    isAdmin,
    isSuperAdmin,
    isSeller,
    isProductOwner
};