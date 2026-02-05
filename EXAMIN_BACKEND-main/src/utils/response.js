export function ok(res, data = {}, status = 200) {
  return res.status(status).json(data);
}

export function created(res, data = {}) {
  return ok(res, data, 201);
}

export function fail(res, error = 'Request failed', status = 400) {
  return res.status(status).json({ error });
}
