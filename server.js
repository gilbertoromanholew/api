import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// --- FUNÇÃO DE VALIDAÇÃO DE CPF (NO BACKEND) ---
function isValidCPF(cpf) {
    cpf = String(cpf).replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === parseInt(cpf.charAt(10));
}

// --- ENDPOINTS ---

// Para validar o CPF
app.post('/validate-cpf', async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ valid: false, message: 'CPF não fornecido.' });
    }

    const isCpfValid = isValidCPF(cpf);

    if (!isCpfValid) {
        return res.status(200).json({ valid: false, message: 'CPF inválido.' });
    }

    // Aqui, futuramente, você poderia adicionar uma chamada a um serviço externo.
    // Por enquanto, apenas retornamos a validação da nossa função.
    
    // O próximo passo é verificar se o CPF já existe no Supabase.
    // Para fazer isso de forma segura, você usaria a chave de SERVIÇO do Supabase aqui.
    // Como não a temos, vamos deixar a verificação de existência para o frontend por enquanto,
    // mas a validação do formato fica aqui.
    
    res.status(200).json({ valid: true, message: 'CPF válido.' });
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
