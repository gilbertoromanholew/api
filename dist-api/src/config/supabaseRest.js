/**
 * Cliente REST direto do Supabase
 * Contorna problemas com o cliente JS do Supabase
 */
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Query direto na API REST do Supabase
 */
export async function supabaseQuery(table, options = {}) {
    const {
        select = '*',
        eq = {},
        order = {},
        limit,
        useServiceRole = false
    } = options;
    
    // Construir query string
    let query = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
    
    // Adicionar filtros
    Object.entries(eq).forEach(([key, value]) => {
        query += `&${key}=eq.${value}`;
    });
    
    // Adicionar ordenação
    Object.entries(order).forEach(([key, ascending]) => {
        query += `&order=${key}.${ascending ? 'asc' : 'desc'}`;
    });
    
    // Adicionar limit
    if (limit) {
        query += `&limit=${limit}`;
    }
    
    // Headers
    const apiKey = useServiceRole ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
    const headers = {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    try {
        const response = await fetch(query, { headers });
        
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        const data = await response.json();
        return { data, error: null };
        
    } catch (error) {
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Insert direto na API REST
 */
export async function supabaseInsert(table, records, useServiceRole = true) {
    const apiKey = useServiceRole ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(records)
        });
        
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        const data = await response.json();
        return { data, error: null };
        
    } catch (error) {
        return { data: null, error: { message: error.message } };
    }
}
