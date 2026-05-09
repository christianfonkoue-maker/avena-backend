/**
 * AVENA - Admin Controller
 * controllers/adminController.js
 */

const db = require('../config/db');

/**
 * Dashboard - Statistiques globales
 */
async function getDashboard(req, res) {
    try {
        // Statistiques globales
        const statsResult = await db.query(`
            SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as revenue,
                (SELECT COUNT(*) FROM products WHERE status = 'active') as products,
                (SELECT COUNT(*) FROM orders) as orders,
                (SELECT COUNT(*) FROM users WHERE role = 'user') as users,
                (SELECT COUNT(*) FROM users WHERE role = 'seller' AND seller_status = 'pending') as pending_sellers,
                (SELECT COALESCE(AVG(rating), 0) FROM products) as avg_rating
        `);
        
        // Ventes des 30 derniers jours
        const salesResult = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(total_amount), 0) as total
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);
        
        // Top catégories
        const categoriesResult = await db.query(`
            SELECT 
                p.category,
                COUNT(*) as count
            FROM products p
            WHERE p.status = 'active'
            GROUP BY p.category
            ORDER BY count DESC
            LIMIT 5
        `);
        
        // Activités récentes
        const activitiesResult = await db.query(`
            SELECT 
                'order' as type,
                o.id as reference_id,
                o.total_amount,
                o.status,
                o.created_at,
                u.first_name || ' ' || u.last_name as user_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);
        
        res.json({
            ok: true,
            stats: statsResult.rows[0],
            charts: {
                sales: {
                    labels: salesResult.rows.map(r => r.date),
                    data: salesResult.rows.map(r => parseFloat(r.total))
                },
                categories: {
                    labels: categoriesResult.rows.map(r => r.category),
                    data: categoriesResult.rows.map(r => parseInt(r.count))
                }
            },
            recentActivities: activitiesResult.rows
        });
    } catch (error) {
        console.error('[Admin] GetDashboard error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Liste des produits (admin)
 */
async function getProducts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { category, status, seller, search } = req.query;
        
        let query = `
            SELECT p.*, u.first_name as seller_name
            FROM products p
            LEFT JOIN users u ON p.seller_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;
        
        if (category) {
            query += ` AND p.category = $${idx++}`;
            params.push(category);
        }
        if (status) {
            query += ` AND p.status = $${idx++}`;
            params.push(status);
        }
        if (seller) {
            query += ` AND p.seller_id = $${idx++}`;
            params.push(seller);
        }
        if (search) {
            query += ` AND p.title ILIKE $${idx++}`;
            params.push(`%${search}%`);
        }
        
        const countQuery = query.replace('SELECT p.*, u.first_name as seller_name', 'SELECT COUNT(*)');
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        res.json({
            ok: true,
            products: result.rows,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('[Admin] GetProducts error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Bulk update product status
 */
async function bulkUpdateStatus(req, res) {
    try {
        const { ids, status } = req.body;
        
        if (!ids || !ids.length) {
            return res.status(400).json({ ok: false, error: 'Aucun produit sélectionné' });
        }
        
        await db.query(
            `UPDATE products SET status = $1, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
            [status, ids]
        );
        
        res.json({ ok: true, message: `${ids.length} produit(s) mis à jour` });
    } catch (error) {
        console.error('[Admin] BulkUpdateStatus error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Bulk delete products
 */
async function bulkDeleteProducts(req, res) {
    try {
        const { ids } = req.body;
        
        if (!ids || !ids.length) {
            return res.status(400).json({ ok: false, error: 'Aucun produit sélectionné' });
        }
        
        await db.query(
            `UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = ANY($1::uuid[])`,
            [ids]
        );
        
        res.json({ ok: true, message: `${ids.length} produit(s) supprimé(s)` });
    } catch (error) {
        console.error('[Admin] BulkDeleteProducts error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Liste des commandes (admin)
 */
async function getOrders(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { status, dateFrom, dateTo } = req.query;
        
        let query = `
            SELECT o.*, u.first_name || ' ' || u.last_name as customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;
        
        if (status) {
            query += ` AND o.status = $${idx++}`;
            params.push(status);
        }
        if (dateFrom) {
            query += ` AND o.created_at >= $${idx++}`;
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ` AND o.created_at <= $${idx++}`;
            params.push(dateTo + ' 23:59:59');
        }
        
        const countResult = await db.query(`SELECT COUNT(*) FROM (${query}) as sub`, params);
        const total = parseInt(countResult.rows[0].count);
        
        query += ` ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        res.json({
            ok: true,
            orders: result.rows,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('[Admin] GetOrders error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Mise à jour du statut d'une commande
 */
async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await db.query(
            `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );
        
        // Log l'historique
        await db.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
             VALUES ($1, $2, $3, $4)`,
            [id, result.rows[0]?.status, status, req.user.id]
        );
        
        res.json({ ok: true, order: result.rows[0] });
    } catch (error) {
        console.error('[Admin] UpdateOrderStatus error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Liste des vendeurs (admin)
 */
async function getSellers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { status, search } = req.query;
        
        let query = `
            SELECT u.*, 
                   COALESCE(p.product_count, 0) as product_count,
                   COALESCE(c.commission_count, 0) as commission_count
            FROM users u
            LEFT JOIN (
                SELECT seller_id, COUNT(*) as product_count 
                FROM products 
                GROUP BY seller_id
            ) p ON p.seller_id = u.id
            LEFT JOIN (
                SELECT seller_id, COUNT(*) as commission_count 
                FROM commissions 
                GROUP BY seller_id
            ) c ON c.seller_id = u.id
            WHERE u.role = 'seller'
        `;
        const params = [];
        let idx = 1;
        
        if (status) {
            query += ` AND u.seller_status = $${idx++}`;
            params.push(status);
        }
        if (search) {
            query += ` AND (u.first_name ILIKE $${idx++} OR u.last_name ILIKE $${idx++} OR u.email ILIKE $${idx++})`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const countResult = await db.query(`SELECT COUNT(*) FROM (${query}) as sub`, params);
        const total = parseInt(countResult.rows[0].count);
        
        query += ` ORDER BY u.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        res.json({
            ok: true,
            sellers: result.rows,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('[Admin] GetSellers error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Détails d'un vendeur
 */
async function getSellerDetails(req, res) {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT u.*, 
                    COALESCE(p.product_count, 0) as product_count,
                    COALESCE(c.commission_total, 0) as commission_total
             FROM users u
             LEFT JOIN (SELECT seller_id, COUNT(*) as product_count FROM products GROUP BY seller_id) p ON p.seller_id = u.id
             LEFT JOIN (SELECT seller_id, SUM(amount) as commission_total FROM commissions GROUP BY seller_id) c ON c.seller_id = u.id
             WHERE u.id = $1 AND u.role = 'seller'`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Vendeur non trouvé' });
        }
        
        res.json({ ok: true, seller: result.rows[0] });
    } catch (error) {
        console.error('[Admin] GetSellerDetails error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Mise à jour de la commission d'un vendeur
 */
async function updateSellerCommission(req, res) {
    try {
        const { id } = req.params;
        const { commission_rate } = req.body;
        
        const result = await db.query(
            `UPDATE users SET commission_rate = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [commission_rate, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Vendeur non trouvé' });
        }
        
        res.json({ ok: true, seller: result.rows[0] });
    } catch (error) {
        console.error('[Admin] UpdateSellerCommission error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Approbation d'un vendeur
 */
async function approveSeller(req, res) {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `UPDATE users SET seller_status = 'approved', role = 'seller', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Vendeur non trouvé' });
        }
        
        res.json({ ok: true, seller: result.rows[0] });
    } catch (error) {
        console.error('[Admin] ApproveSeller error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Rejet d'un vendeur
 */
async function rejectSeller(req, res) {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `UPDATE users SET seller_status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Vendeur non trouvé' });
        }
        
        res.json({ ok: true, seller: result.rows[0] });
    } catch (error) {
        console.error('[Admin] RejectSeller error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Export des vendeurs en CSV
 */
async function exportSellers(req, res) {
    try {
        const result = await db.query(`
            SELECT u.first_name, u.last_name, u.email, u.created_at, u.seller_status,
                   COALESCE(p.product_count, 0) as product_count
            FROM users u
            LEFT JOIN (SELECT seller_id, COUNT(*) as product_count FROM products GROUP BY seller_id) p ON p.seller_id = u.id
            WHERE u.role = 'seller'
            ORDER BY u.created_at DESC
        `);
        
        let csv = 'Prénom,Nom,Email,Date inscription,Statut,Nombre produits\n';
        
        for (const seller of result.rows) {
            csv += `"${seller.first_name || ''}","${seller.last_name || ''}","${seller.email}","${new Date(seller.created_at).toLocaleDateString()}","${seller.seller_status}","${seller.product_count}"\n`;
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=vendeurs_${new Date().toISOString().slice(0,10)}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('[Admin] ExportSellers error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Liste des clients
 */
async function getCustomers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { search } = req.query;
        
        let query = `
            SELECT u.*, COALESCE(o.order_count, 0) as order_count, COALESCE(o.total_spent, 0) as total_spent
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) as order_count, SUM(total_amount) as total_spent
                FROM orders
                GROUP BY user_id
            ) o ON o.user_id = u.id
            WHERE u.role = 'user'
        `;
        const params = [];
        let idx = 1;
        
        if (search) {
            query += ` AND (u.first_name ILIKE $${idx++} OR u.last_name ILIKE $${idx++} OR u.email ILIKE $${idx++})`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const countResult = await db.query(`SELECT COUNT(*) FROM (${query}) as sub`, params);
        const total = parseInt(countResult.rows[0].count);
        
        query += ` ORDER BY u.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        res.json({
            ok: true,
            customers: result.rows,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('[Admin] GetCustomers error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Blocage d'un client
 */
async function blockCustomer(req, res) {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `UPDATE users SET status = 'blocked', updated_at = NOW() WHERE id = $1 AND role = 'user' RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Client non trouvé' });
        }
        
        res.json({ ok: true, customer: result.rows[0] });
    } catch (error) {
        console.error('[Admin] BlockCustomer error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Statistiques analytics
 */
async function getAnalytics(req, res) {
    try {
        const { period = 30 } = req.query;
        
        // Ventes par jour
        const salesResult = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(total_amount), 0) as total
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '${period} days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);
        
        // Top produits
        const topProductsResult = await db.query(`
            SELECT 
                p.id, p.title, p.category, COUNT(oi.id) as sales_count
            FROM products p
            JOIN order_items oi ON oi.product_id = p.id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status = 'delivered'
            GROUP BY p.id, p.title, p.category
            ORDER BY sales_count DESC
            LIMIT 10
        `);
        
        // Statistiques globales
        const statsResult = await db.query(`
            SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as total_revenue,
                (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as total_orders,
                (SELECT COUNT(*) FROM users WHERE role = 'user') as total_customers,
                (SELECT COUNT(*) FROM products WHERE status = 'active') as total_products,
                (SELECT COALESCE(AVG(rating), 0) FROM products) as avg_rating
        `);
        
        res.json({
            ok: true,
            stats: statsResult.rows[0],
            charts: {
                sales: {
                    labels: salesResult.rows.map(r => r.date),
                    data: salesResult.rows.map(r => parseFloat(r.total))
                }
            },
            topProducts: topProductsResult.rows
        });
    } catch (error) {
        console.error('[Admin] GetAnalytics error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Gestion des bannières
 */
async function getBanners(req, res) {
    try {
        const result = await db.query(`
            SELECT * FROM banners ORDER BY sort_order
        `);
        res.json({ ok: true, banners: result.rows });
    } catch (error) {
        console.error('[Admin] GetBanners error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

async function createBanner(req, res) {
    try {
        const { title, description, image_url, link_url, position, sort_order, is_active, start_date, end_date } = req.body;
        
        const result = await db.query(`
            INSERT INTO banners (id, title, description, image_url, link_url, position, sort_order, is_active, start_date, end_date)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [title, description, image_url, link_url, position, sort_order || 0, is_active !== false, start_date, end_date]);
        
        res.json({ ok: true, banner: result.rows[0] });
    } catch (error) {
        console.error('[Admin] CreateBanner error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

async function updateBanner(req, res) {
    try {
        const { id } = req.params;
        const { title, description, image_url, link_url, position, sort_order, is_active, start_date, end_date } = req.body;
        
        const result = await db.query(`
            UPDATE banners SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                image_url = COALESCE($3, image_url),
                link_url = COALESCE($4, link_url),
                position = COALESCE($5, position),
                sort_order = COALESCE($6, sort_order),
                is_active = COALESCE($7, is_active),
                start_date = COALESCE($8, start_date),
                end_date = COALESCE($9, end_date),
                updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `, [title, description, image_url, link_url, position, sort_order, is_active, start_date, end_date, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Bannière non trouvée' });
        }
        
        res.json({ ok: true, banner: result.rows[0] });
    } catch (error) {
        console.error('[Admin] UpdateBanner error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

async function deleteBanner(req, res) {
    try {
        const { id } = req.params;
        
        const result = await db.query(`DELETE FROM banners WHERE id = $1 RETURNING id`, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'Bannière non trouvée' });
        }
        
        res.json({ ok: true });
    } catch (error) {
        console.error('[Admin] DeleteBanner error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Notifications
 */
async function getNotifications(req, res) {
    try {
        const result = await db.query(`
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [req.user.id]);
        
        const unreadResult = await db.query(`
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = $1 AND is_read = false
        `, [req.user.id]);
        
        res.json({
            ok: true,
            notifications: result.rows,
            unreadCount: parseInt(unreadResult.rows[0].count)
        });
    } catch (error) {
        console.error('[Admin] GetNotifications error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        
        await db.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );
        
        res.json({ ok: true });
    } catch (error) {
        console.error('[Admin] MarkNotificationRead error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

async function markAllNotificationsRead(req, res) {
    try {
        await db.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );
        
        res.json({ ok: true });
    } catch (error) {
        console.error('[Admin] MarkAllNotificationsRead error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

/**
 * Paramètres système
 */
async function getSettings(req, res) {
    try {
        const result = await db.query(`SELECT key, value FROM system_settings`);
        
        const settings = {};
        result.rows.forEach(row => {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        });
        
        res.json({ ok: true, settings });
    } catch (error) {
        console.error('[Admin] GetSettings error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

async function updateSettings(req, res) {
    try {
        const updates = req.body;
        
        for (const [key, value] of Object.entries(updates)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            await db.query(
                `INSERT INTO system_settings (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                [key, stringValue]
            );
        }
        
        res.json({ ok: true });
    } catch (error) {
        console.error('[Admin] UpdateSettings error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
}

module.exports = {
    getDashboard,
    getProducts,
    bulkUpdateStatus,
    bulkDeleteProducts,
    getOrders,
    updateOrderStatus,
    getSellers,
    getSellerDetails,
    updateSellerCommission,
    approveSeller,
    rejectSeller,
    exportSellers,
    getCustomers,
    blockCustomer,
    getAnalytics,
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getSettings,
    updateSettings
};