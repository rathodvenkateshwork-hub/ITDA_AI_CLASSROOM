import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

let dbCheckPromise = null;

function normalizeFilter(filter) {
  if (!filter || typeof filter !== "object") return {};
  return filter;
}

function applyFilter(query, filter) {
  const normalized = normalizeFilter(filter);

  if (normalized.$or && Array.isArray(normalized.$or) && normalized.$or.length > 0) {
    const idValues = normalized.$or
      .map((clause) => (clause && Object.prototype.hasOwnProperty.call(clause, "id") ? clause.id : undefined))
      .filter((value) => value !== undefined && value !== null);
    if (idValues.length > 0) {
      query = query.in("id", Array.from(new Set(idValues)));
    }
  }

  for (const [field, value] of Object.entries(normalized)) {
    if (field === "$or") continue;
    if (value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, "$in")) {
      query = query.in(field, value.$in || []);
      continue;
    }
    if (value !== undefined) {
      query = query.eq(field, value);
    }
  }

  return query;
}

function extractEqualityFields(filter) {
  const normalized = normalizeFilter(filter);
  const out = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (key.startsWith("$")) continue;
    if (value && typeof value === "object") continue;
    out[key] = value;
  }
  return out;
}

class SupabaseQuery {
  constructor(table, filter = {}, single = false) {
    this.table = table;
    this.filter = filter;
    this.single = single;
    this.sortSpec = null;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  async lean() {
    let query = supabase.from(this.table).select("*");
    query = applyFilter(query, this.filter);

    if (this.sortSpec && typeof this.sortSpec === "object") {
      for (const [column, direction] of Object.entries(this.sortSpec)) {
        query = query.order(column, { ascending: Number(direction) >= 0 });
      }
    }

    if (this.single) {
      query = query.limit(1);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`[${this.table}] ${error.message}`);
    }

    if (this.single) {
      return Array.isArray(data) ? data[0] || null : data || null;
    }

    return Array.isArray(data) ? data : [];
  }

  then(resolve, reject) {
    return this.lean().then(resolve, reject);
  }
}

class SupabaseModel {
  constructor(table) {
    this.table = table;
  }

  find(filter = {}) {
    return new SupabaseQuery(this.table, filter, false);
  }

  findOne(filter = {}) {
    return new SupabaseQuery(this.table, filter, true);
  }

  async create(doc) {
    const { data, error } = await supabase.from(this.table).insert(doc).select("*").limit(1);
    if (error) throw new Error(`[${this.table}] ${error.message}`);
    return Array.isArray(data) ? data[0] || null : data || null;
  }

  async insertMany(docs) {
    if (!Array.isArray(docs) || docs.length === 0) return [];
    const { data, error } = await supabase.from(this.table).insert(docs).select("*");
    if (error) throw new Error(`[${this.table}] ${error.message}`);
    return data || [];
  }

  async findOneAndUpdate(filter, updateDoc = {}, options = {}) {
    const updates = updateDoc && typeof updateDoc === "object" && updateDoc.$set ? updateDoc.$set : updateDoc;
    const existing = await this.findOne(filter).lean();

    if (!existing) {
      if (options.upsert) {
        const createDoc = { ...extractEqualityFields(filter), ...(updates || {}) };
        return this.create(createDoc);
      }
      return null;
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updates || {})
      .eq("id", existing.id)
      .select("*")
      .limit(1);

    if (error) throw new Error(`[${this.table}] ${error.message}`);
    return Array.isArray(data) ? data[0] || null : data || null;
  }

  async deleteOne(filter) {
    const existing = await this.findOne(filter).lean();
    if (!existing) return { deletedCount: 0 };

    const { error } = await supabase.from(this.table).delete().eq("id", existing.id);
    if (error) throw new Error(`[${this.table}] ${error.message}`);
    return { deletedCount: 1 };
  }

  async deleteMany(filter) {
    let query = supabase.from(this.table).delete().select("id");
    query = applyFilter(query, filter);
    const { data, error } = await query;
    if (error) throw new Error(`[${this.table}] ${error.message}`);
    return { deletedCount: Array.isArray(data) ? data.length : 0 };
  }
}

export function makeLooseModel(_name, table) {
  return new SupabaseModel(table);
}

export async function getNextId(table) {
  const { data, error } = await supabase.from(table).select("id").order("id", { ascending: false }).limit(1);
  if (error) throw new Error(`[${table}] ${error.message}`);
  const currentMax = Array.isArray(data) && data.length > 0 ? Number(data[0].id) || 0 : 0;
  return currentMax + 1;
}

export async function ensureSupabase() {
  if (!dbCheckPromise) {
    dbCheckPromise = (async () => {
      const { error } = await supabase.from("schools").select("id").limit(1);
      if (error && !String(error.message || "").toLowerCase().includes("relation") && !String(error.message || "").toLowerCase().includes("does not exist")) {
        throw new Error(error.message);
      }
      return true;
    })().finally(() => {
      dbCheckPromise = null;
    });
  }
  await dbCheckPromise;
}
