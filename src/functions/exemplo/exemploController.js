import { BaseController } from '../../core/BaseController.js';

/**
 * Controller de exemplo - Gerenciamento de Usuários Fictícios
 * 
 * Demonstra o uso do BaseController com operações CRUD completas
 */
class ExemploController extends BaseController {
    // Banco de dados em memória (apenas para demonstração)
    #usuarios = [
        { id: 1, nome: 'João Silva', email: 'joao@exemplo.com', idade: 30, ativo: true },
        { id: 2, nome: 'Maria Santos', email: 'maria@exemplo.com', idade: 25, ativo: true },
        { id: 3, nome: 'Pedro Costa', email: 'pedro@exemplo.com', idade: 35, ativo: false }
    ];
    #nextId = 4;

    /**
     * GET /usuarios - Lista todos os usuários
     */
    async listarUsuarios(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { ativo, idade_min, idade_max } = req.query;

            let usuarios = [...this.#usuarios];

            // Filtro por status ativo
            if (ativo !== undefined) {
                const isAtivo = ativo === 'true' || ativo === '1';
                usuarios = usuarios.filter(u => u.ativo === isAtivo);
            }

            // Filtro por idade mínima
            if (idade_min) {
                usuarios = usuarios.filter(u => u.idade >= parseInt(idade_min));
            }

            // Filtro por idade máxima
            if (idade_max) {
                usuarios = usuarios.filter(u => u.idade <= parseInt(idade_max));
            }

            return this.success(res, {
                total: usuarios.length,
                usuarios
            }, `${usuarios.length} usuário(s) encontrado(s)`);
        });
    }

    /**
     * GET /usuarios/:id - Busca um usuário por ID
     */
    async buscarUsuario(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { id } = req.params;
            const usuario = this.#usuarios.find(u => u.id === parseInt(id));

            if (!usuario) {
                return this.error(res, `Usuário com ID ${id} não encontrado`, 404);
            }

            return this.success(res, usuario, 'Usuário encontrado');
        });
    }

    /**
     * POST /usuarios - Cria um novo usuário
     */
    async criarUsuario(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { nome, email, idade, ativo } = req.body;

            // Verifica se email já existe
            const emailExiste = this.#usuarios.some(u => u.email === email);
            if (emailExiste) {
                return this.error(res, 'Email já está em uso', 400, {
                    campo: 'email',
                    valor: email
                });
            }

            const novoUsuario = {
                id: this.#nextId++,
                nome,
                email,
                idade: parseInt(idade),
                ativo: ativo !== undefined ? ativo : true,
                criadoEm: new Date().toISOString()
            };

            this.#usuarios.push(novoUsuario);

            return this.success(res, novoUsuario, 'Usuário criado com sucesso', 201);
        });
    }

    /**
     * PUT /usuarios/:id - Atualiza um usuário existente
     */
    async atualizarUsuario(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { id } = req.params;
            const { nome, email, idade, ativo } = req.body;

            const index = this.#usuarios.findIndex(u => u.id === parseInt(id));

            if (index === -1) {
                return this.error(res, `Usuário com ID ${id} não encontrado`, 404);
            }

            // Verifica se email já existe em outro usuário
            if (email) {
                const emailExiste = this.#usuarios.some(
                    u => u.email === email && u.id !== parseInt(id)
                );
                if (emailExiste) {
                    return this.error(res, 'Email já está em uso por outro usuário', 400, {
                        campo: 'email',
                        valor: email
                    });
                }
            }

            // Atualiza apenas os campos fornecidos
            const usuarioAtualizado = {
                ...this.#usuarios[index],
                ...(nome && { nome }),
                ...(email && { email }),
                ...(idade && { idade: parseInt(idade) }),
                ...(ativo !== undefined && { ativo }),
                atualizadoEm: new Date().toISOString()
            };

            this.#usuarios[index] = usuarioAtualizado;

            return this.success(res, usuarioAtualizado, 'Usuário atualizado com sucesso');
        });
    }

    /**
     * DELETE /usuarios/:id - Remove um usuário
     */
    async deletarUsuario(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { id } = req.params;
            const index = this.#usuarios.findIndex(u => u.id === parseInt(id));

            if (index === -1) {
                return this.error(res, `Usuário com ID ${id} não encontrado`, 404);
            }

            const usuarioRemovido = this.#usuarios.splice(index, 1)[0];

            return this.success(res, usuarioRemovido, 'Usuário removido com sucesso');
        });
    }

    /**
     * GET /usuarios/estatisticas - Retorna estatísticas dos usuários
     */
    async estatisticas(req, res) {
        return this.execute(req, res, async (req, res) => {
            const total = this.#usuarios.length;
            const ativos = this.#usuarios.filter(u => u.ativo).length;
            const inativos = total - ativos;
            const idadeMedia = this.#usuarios.reduce((sum, u) => sum + u.idade, 0) / total;
            const maisJovem = Math.min(...this.#usuarios.map(u => u.idade));
            const maisVelho = Math.max(...this.#usuarios.map(u => u.idade));

            return this.success(res, {
                total,
                ativos,
                inativos,
                percentualAtivos: total > 0 ? ((ativos / total) * 100).toFixed(2) + '%' : '0%',
                idade: {
                    media: parseFloat(idadeMedia.toFixed(1)),
                    minima: maisJovem,
                    maxima: maisVelho
                }
            }, 'Estatísticas calculadas');
        });
    }
}

export default new ExemploController();
