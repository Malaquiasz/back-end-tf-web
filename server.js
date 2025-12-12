// server.js - Versão Corrigida e Otimizada
import express from "express";
import pkg from "pg";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();
const port = process.env.PORT || 3000;
const { Pool } = pkg;

// Configuração do pool de conexões
const pool = new Pool({
    connectionString: process.env.URL_BD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== FUNÇÕES AUXILIARES ==========
function conectarBD() {
    return pool;
}

function calcularDataExpiracao(meses = 3) {
    const data = new Date();
    data.setMonth(data.getMonth() + meses);
    return data.toISOString().split('T')[0];
}

// ========== ROTAS DE OBJETOS ==========

// GET / - Rota raiz
app.get("/", async (req, res) => {
    console.log("Rota GET / solicitada");
    
    let dbStatus = "ok";
    try {
        await pool.query("SELECT 1");
    } catch (e) {
        dbStatus = e.message;
    }

    res.json({
        descricao: "API para plataforma de objetos perdidos no IFNMG-Campus Salinas",
        autor: "Equipe de Desenvolvimento",
        status: "online",
        statusBD: dbStatus,
        versao: "1.0.0"
    });
});

// GET /objetos - Retorna todos os objetos não expirados
app.get("/objetos", async (req, res) => {
    console.log("Rota GET /objetos solicitada");
    
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const consulta = `
            SELECT *, 
                CASE 
                    WHEN dataExpiracao < $1 THEN 'expirado'
                    WHEN DATE_PART('day', dataExpiracao::timestamp - $1::timestamp) <= 7 THEN 'expirando'
                    ELSE 'ativo'
                END as status
            FROM Objeto 
            WHERE dataExpiracao >= $1
            ORDER BY dataRegistro DESC
        `;
        const resultado = await pool.query(consulta, [hoje]);
        res.json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar objetos:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// GET /objetos/:id - Retorna um objeto específico
app.get("/objetos/:id", async (req, res) => {
    console.log(`Rota GET /objetos/${req.params.id} solicitada`);
    
    try {
        const consulta = "SELECT * FROM Objeto WHERE id = $1";
        const resultado = await pool.query(consulta, [req.params.id]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Objeto não encontrado" });
        }
        
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error("Erro ao buscar objeto:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// GET /objetos/:id/palavra/:palavraPasse - Valida palavra-passe via URL (GET)
app.get("/objetos/:id/palavra/:palavraPasse", async (req, res) => {
    console.log(`Rota GET /objetos/${req.params.id}/palavra solicitada`);
    try {
        const { id, palavraPasse } = req.params;

        if (!palavraPasse) {
            return res.status(400).json({ erro: "Palavra-passe é obrigatória" });
        }

        const consulta = "SELECT palavraPasse FROM Objeto WHERE id = $1";
        const resultado = await pool.query(consulta, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Objeto não encontrado" });
        }

        const valido = palavraPasse === resultado.rows[0].palavrapasse;

        res.json({
            valido,
            mensagem: valido ? "Senha válida" : "Senha incorreta"
        });

    } catch (error) {
        console.error("Erro ao validar senha via URL:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// GET /objetos/local/:local/categoria/:categoria - Filtra objetos por local e categoria
app.get("/objetos/local/:local/categoria/:categoria", async (req, res) => {
    console.log(`Rota GET /objetos/local/${req.params.local}/categoria/${req.params.categoria} solicitada`);
    try {
        const { local, categoria } = req.params;
        const hoje = new Date().toISOString().split('T')[0];

        const consulta = `
            SELECT *, 
                CASE 
                    WHEN dataExpiracao < $1 THEN 'expirado'
                    WHEN DATE_PART('day', dataExpiracao::timestamp - $1::timestamp) <= 7 THEN 'expirando'
                    ELSE 'ativo'
                END as status
            FROM Objeto 
            WHERE dataExpiracao >= $1
              AND LOWER(local) = LOWER($2)
              AND LOWER(categoria) = LOWER($3)
            ORDER BY dataRegistro DESC
        `;

        const resultado = await pool.query(consulta, [hoje, local, categoria]);
        res.json(resultado.rows);
    } catch (error) {
        console.error("Erro ao filtrar objetos por local/categoria:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// POST /objetos - Cria um novo objeto
app.post("/objetos", async (req, res) => {
    console.log("Rota POST /objetos solicitada");
    
    try {
        const { 
            titulo, 
            categoria, 
            descricao, 
            local, 
            palavraPasse, 
            imagem,
            instagram,
            contato 
        } = req.body;

        // Validação dos campos obrigatórios
        if (!titulo || !categoria || !local || !palavraPasse) {
            return res.status(400).json({ 
                erro: "Campos obrigatórios faltando",
                camposObrigatorios: ["titulo", "categoria", "local", "palavraPasse"]
            });
        }

        // Validação de pelo menos um contato
        if (!instagram && !contato) {
            return res.status(400).json({
                erro: "Pelo menos um método de contato é obrigatório",
                mensagem: "Informe WhatsApp ou Instagram"
            });
        }

        const dataExpiracao = calcularDataExpiracao();
        
        const consulta = `
            INSERT INTO Objeto (
                titulo, descricao, categoria, local, 
                dataRegistro, dataExpiracao, foto, 
                palavraPasse, contatoInstagram, contatoWhatsapp,
                denuncia, statusDenuncia
            ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, FALSE, FALSE)
            RETURNING id, titulo, dataRegistro, dataExpiracao
        `;
        
        const valores = [
            titulo.trim(),
            descricao?.trim() || null,
            categoria.trim(),
            local.trim(),
            dataExpiracao,
            imagem || null,
            palavraPasse.trim(),
            instagram?.trim() || null,
            contato?.replace(/\D/g, '') || null
        ];

        const resultado = await pool.query(consulta, valores);
        
        res.status(201).json({
            mensagem: "Objeto criado com sucesso!",
            objeto: resultado.rows[0],
            lembrete: "Guarde a palavra-passe para exclusão futura"
        });

    } catch (error) {
        console.error("Erro ao criar objeto:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// PUT /objetos/:id - Atualiza um objeto
app.put("/objetos/:id", async (req, res) => {
    console.log(`Rota PUT /objetos/${req.params.id} solicitada`);
    
    try {
        const { palavraPasse, ...dados } = req.body;
        
        // Verificar se o objeto existe e se a senha está correta
        const verificarConsulta = "SELECT id, palavraPasse FROM Objeto WHERE id = $1";
        const verificarResultado = await pool.query(verificarConsulta, [req.params.id]);
        
        if (verificarResultado.rows.length === 0) {
            return res.status(404).json({ erro: "Objeto não encontrado" });
        }
        
        if (!palavraPasse || palavraPasse !== verificarResultado.rows[0].palavrapasse) {
            return res.status(401).json({ erro: "Palavra-passe incorreta" });
        }
        
        // Construir consulta de atualização dinâmica
        const campos = [];
        const valores = [];
        let contador = 1;
        
        if (dados.titulo) {
            campos.push(`titulo = $${contador}`);
            valores.push(dados.titulo.trim());
            contador++;
        }
        
        if (dados.descricao !== undefined) {
            campos.push(`descricao = $${contador}`);
            valores.push(dados.descricao?.trim() || null);
            contador++;
        }
        
        if (dados.categoria) {
            campos.push(`categoria = $${contador}`);
            valores.push(dados.categoria.trim());
            contador++;
        }
        
        if (dados.local) {
            campos.push(`local = $${contador}`);
            valores.push(dados.local.trim());
            contador++;
        }
        
        if (dados.foto !== undefined) {
            campos.push(`foto = $${contador}`);
            valores.push(dados.foto || null);
            contador++;
        }
        
        if (dados.contatoInstagram !== undefined) {
            campos.push(`contatoInstagram = $${contador}`);
            valores.push(dados.contatoInstagram?.trim() || null);
            contador++;
        }
        
        if (dados.contatoWhatsapp !== undefined) {
            campos.push(`contatoWhatsapp = $${contador}`);
            valores.push(dados.contatoWhatsapp?.replace(/\D/g, '') || null);
            contador++;
        }
        
        if (campos.length === 0) {
            return res.status(400).json({ erro: "Nenhum dado para atualizar" });
        }
        
        valores.push(req.params.id);
        const consulta = `UPDATE Objeto SET ${campos.join(', ')} WHERE id = $${contador}`;
        
        await pool.query(consulta, valores);
        
        res.json({ mensagem: "Objeto atualizado com sucesso!" });
        
    } catch (error) {
        console.error("Erro ao atualizar objeto:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// DELETE /objetos/:id - Exclui um objeto
app.delete("/objetos/:id", async (req, res) => {
    console.log(`Rota DELETE /objetos/${req.params.id} solicitada`);
    
    try {
        let { palavraPasse } = req.body;

        if (!palavraPasse) {
            return res.status(400).json({ erro: "Palavra-passe é obrigatória para exclusão" });
        }

        palavraPasse = palavraPasse.trim();

        // Aplica exclusão segura comparando id + palavraPasse em uma única query.
        const consulta = "DELETE FROM Objeto WHERE id = $1 AND palavraPasse = $2 RETURNING id";
        const resultado = await pool.query(consulta, [req.params.id, palavraPasse]);

        // Se nada foi removido, verificar se o objeto existe ou se a senha está incorreta
        if (resultado.rowCount === 0) {
            const existe = await pool.query("SELECT 1 FROM Objeto WHERE id = $1", [req.params.id]);
            if (existe.rowCount === 0) {
                return res.status(404).json({ erro: "Objeto não encontrado" });
            }
            return res.status(401).json({ erro: "Palavra-passe incorreta" });
        }

        res.json({ mensagem: "Objeto excluído com sucesso!" });
        
    } catch (error) {
        console.error("Erro ao excluir objeto:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// GET /objetos/:id/validar - Valida senha para operações
app.post("/objetos/:id/validar", async (req, res) => {
    console.log(`Rota POST /objetos/${req.params.id}/validar solicitada`);
    
    try {
        const { palavraPasse } = req.body;
        
        if (!palavraPasse) {
            return res.status(400).json({ erro: "Palavra-passe é obrigatória" });
        }
        
        const consulta = "SELECT palavraPasse FROM Objeto WHERE id = $1";
        const resultado = await pool.query(consulta, [req.params.id]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Objeto não encontrado" });
        }
        
        const senhaCorreta = palavraPasse === resultado.rows[0].palavrapasse;
        
        res.json({ 
            valido: senhaCorreta,
            mensagem: senhaCorreta ? "Senha válida" : "Senha incorreta"
        });
        
    } catch (error) {
        console.error("Erro ao validar senha:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// ========== ROTAS DE ADMINISTRAÇÃO ==========

// POST /login - Autenticação de administrador
app.post("/login", async (req, res) => {
    console.log("Rota POST /login solicitada");
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                erro: "Credenciais incompletas",
                mensagem: "Username e password são obrigatórios"
            });
        }
        
        // Credenciais fixas para simplificação
        const ADMIN_CRED = {
            username: "admin",
            password: "admin123"
        };
        
        if (username === ADMIN_CRED.username && password === ADMIN_CRED.password) {
            res.json({
                mensagem: "Login realizado com sucesso!",
                admin: { username: ADMIN_CRED.username },
                token: "admin_token_" + Date.now()
            });
        } else {
            res.status(401).json({ 
                erro: "Credenciais inválidas",
                mensagem: "Username ou password incorretos"
            });
        }
        
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// GET /admin/objetos - Retorna todos os objetos (incluindo expirados)
app.get("/admin/objetos", async (req, res) => {
    console.log("Rota GET /admin/objetos solicitada");
    
    try {
        const consulta = `
            SELECT *, 
                CASE 
                    WHEN dataExpiracao < CURRENT_DATE THEN 'expirado'
                    WHEN DATE_PART('day', dataExpiracao::timestamp - CURRENT_DATE) <= 7 THEN 'expirando'
                    ELSE 'ativo'
                END as status
            FROM Objeto 
            ORDER BY dataRegistro DESC
        `;
        const resultado = await pool.query(consulta);
        res.json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar objetos admin:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// GET /admin/denuncias - Retorna objetos denunciados
app.get("/admin/denuncias", async (req, res) => {
    console.log("Rota GET /admin/denuncias solicitada");
    
    try {
        const consulta = "SELECT * FROM Objeto WHERE denuncia = TRUE ORDER BY dataRegistro DESC";
        const resultado = await pool.query(consulta);
        res.json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar denúncias:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// POST /admin/objetos/:id/denunciar - Denunciar um objeto
app.post("/admin/objetos/:id/denunciar", async (req, res) => {
    console.log(`Rota POST /admin/objetos/${req.params.id}/denunciar solicitada`);
    
    try {
        const consulta = "UPDATE Objeto SET denuncia = TRUE WHERE id = $1";
        await pool.query(consulta, [req.params.id]);
        
        res.json({ mensagem: "Objeto denunciado com sucesso!" });
        
    } catch (error) {
        console.error("Erro ao denunciar objeto:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// POST /admin/objetos/:id/resolver-denuncia - Resolver denúncia
app.post("/admin/objetos/:id/resolver-denuncia", async (req, res) => {
    console.log(`Rota POST /admin/objetos/${req.params.id}/resolver-denuncia solicitada`);
    
    try {
        const { acao } = req.body; // 'aprovar' ou 'rejeitar'
        
        if (!['aprovar', 'rejeitar'].includes(acao)) {
            return res.status(400).json({ erro: "Ação inválida. Use 'aprovar' ou 'rejeitar'" });
        }
        
        if (acao === 'aprovar') {
            // Remove o objeto
            await pool.query("DELETE FROM Objeto WHERE id = $1", [req.params.id]);
            res.json({ mensagem: "Denúncia aprovada e objeto removido!" });
        } else {
            // Marca como rejeitada
            await pool.query("UPDATE Objeto SET denuncia = FALSE, statusDenuncia = FALSE WHERE id = $1", [req.params.id]);
            res.json({ mensagem: "Denúncia rejeitada!" });
        }
        
    } catch (error) {
        console.error("Erro ao resolver denúncia:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// DELETE /admin/objetos/:id - Exclusão administrativa
app.delete("/admin/objetos/:id", async (req, res) => {
    console.log(`Rota DELETE /admin/objetos/${req.params.id} solicitada`);
    
    try {
        await pool.query("DELETE FROM Objeto WHERE id = $1", [req.params.id]);
        res.json({ mensagem: "Objeto excluído administrativamente!" });
        
    } catch (error) {
        console.error("Erro ao excluir objeto admin:", error);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

// ========== MIDDLEWARE DE ERRO ==========
app.use((err, req, res, next) => {
    console.error("Erro não tratado:", err);
    res.status(500).json({ 
        erro: "Erro interno do servidor",
        detalhes: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ========== INICIALIZAÇÃO ==========
// Em ambientes serverless (Vercel) não devemos chamar `listen`.
// Exportamos o `app` para ser usado pelo runtime do Vercel.
export default app;