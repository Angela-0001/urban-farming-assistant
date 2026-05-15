/**
 * Paginate a Mongoose query.
 * @param {import('mongoose').Query} query - Mongoose query (not yet executed)
 * @param {number|string} page - Page number (min 1)
 * @param {number|string} limit - Items per page (1–100)
 * @returns {Promise<{data, total, page, totalPages, hasNext, hasPrev}>}
 */
async function paginate(query, page, limit) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (p - 1) * l;

  // Clone the query conditions to count without skip/limit
  const countQuery = query.model.countDocuments(query.getFilter());

  const [data, total] = await Promise.all([
    query.skip(skip).limit(l),
    countQuery
  ]);

  const totalPages = Math.ceil(total / l);

  return {
    data,
    total,
    page: p,
    totalPages,
    hasNext: p < totalPages,
    hasPrev: p > 1
  };
}

module.exports = paginate;
