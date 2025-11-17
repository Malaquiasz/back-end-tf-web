// ######
// Local onde os pacotes de dependências serão importados
// ######
import express from "express";      // Requisição do pacote do express
import pkg from "pg";
import dotenv from "dotenv";

// ######
// Local onde as configurações do servidor serão feitas
// ######
const app = express();              // Instancia o Express
const port = 3000;                  // Define a porta
dotenv.config();                    // Carrega e processa o arquivo .env
const { Pool } = pkg;               // Utiliza a Classe Pool do Postgres

// Middleware para parsear JSON
app.use(express.json());

// Função para conectar ao banco de dados
async function conectarBD() {
  const db = new Pool({
    connectionString: process.env.URL_BD,
  });
  return db;
}

// ######
// Local onde as rotas (endpoints) serão definidas
// ######

// Rota raiz
app.get("/", async (req, res) => {
  console.log("Rota GET / solicitada");

  const db = await conectarBD();
  let dbStatus = "ok";

  try {
    await db.query("SELECT 1");
  } catch (e) {
    dbStatus = e.message;
  } finally {
    db.end();
  }

  res.json({
    descricao: "API para plataforma de objetos perdidos no IFNMG-Campus Salinas",
    autor: "Andrey Paulino Costa, Hugo Barros Correia, João Pedro Almeida Caldeira, Luick Eduardo Neres Costa, Mizael Miranda Barbosa",
    statusBD: dbStatus
  });
});

// CRUD para Objetos

// GET /objetos - Listar todos os objetos
app.get("/objetos", async (req, res) => {
  console.log("Rota GET /objetos solicitada");

  const db = await conectarBD();
  try {
    const result = await db.query("SELECT * FROM objeto ORDER BY data_encontrado DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar objetos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// GET /objetos/:id - Buscar objeto por ID
app.get("/objetos/:id", async (req, res) => {
  console.log(`Rota GET /objetos/${req.params.id} solicitada`);

  const db = await conectarBD();
  try {
    const result = await db.query("SELECT * FROM objeto WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Objeto não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar objeto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// POST /objetos - Criar novo objeto
app.post("/objetos", async (req, res) => {
  console.log("Rota POST /objetos solicitada");

  const { titulo, descricao, categoria, local_encontrado, contato_whatsapp, contato_instagram, palavra_passe, imagem_url } = req.body;

  // Validação básica
  if (!titulo || !descricao || !categoria || !local_encontrado || !palavra_passe) {
    return res.status(400).json({ error: "Campos obrigatórios: titulo, descricao, categoria, local_encontrado, palavra_passe" });
  }

  const db = await conectarBD();
  try {
    const result = await db.query(
      "INSERT INTO objeto (titulo, descricao, categoria, local_encontrado, contato_whatsapp, contato_instagram, palavra_passe, imagem_url, data_encontrado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE) RETURNING *",
      [titulo, descricao, categoria, local_encontrado, contato_whatsapp, contato_instagram, palavra_passe, imagem_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar objeto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// PUT /objetos/:id - Atualizar objeto
app.put("/objetos/:id", async (req, res) => {
  console.log(`Rota PUT /objetos/${req.params.id} solicitada`);

  const { titulo, descricao, categoria, local_encontrado, contato_whatsapp, contato_instagram, palavra_passe, imagem_url } = req.body;

  if (!titulo || !descricao || !categoria || !local_encontrado || !palavra_passe) {
    return res.status(400).json({ error: "Campos obrigatórios: titulo, descricao, categoria, local_encontrado, palavra_passe" });
  }

  const db = await conectarBD();
  try {
    const result = await db.query(
      "UPDATE objeto SET titulo = $1, descricao = $2, categoria = $3, local_encontrado = $4, contato_whatsapp = $5, contato_instagram = $6, palavra_passe = $7, imagem_url = $8 WHERE id = $9 RETURNING *",
      [titulo, descricao, categoria, local_encontrado, contato_whatsapp, contato_instagram, palavra_passe, imagem_url, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Objeto não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar objeto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// DELETE /objetos/:id - Deletar objeto
app.delete("/objetos/:id", async (req, res) => {
  console.log(`Rota DELETE /objetos/${req.params.id} solicitada`);

  const db = await conectarBD();
  try {
    const result = await db.query("DELETE FROM objeto WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Objeto não encontrado" });
    }
    res.json({ message: "Objeto deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar objeto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// CRUD para Administradores

// GET /administradores - Listar todos os administradores
app.get("/administradores", async (req, res) => {
  console.log("Rota GET /administradores solicitada");

  const db = await conectarBD();
  try {
    const result = await db.query("SELECT username FROM administrador");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar administradores:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// GET /administradores/:username - Buscar administrador por username
app.get("/administradores/:username", async (req, res) => {
  console.log(`Rota GET /administradores/${req.params.username} solicitada`);

  const db = await conectarBD();
  try {
    const result = await db.query("SELECT username FROM administrador WHERE username = $1", [req.params.username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar administrador:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// POST /administradores - Criar novo administrador
app.post("/administradores", async (req, res) => {
  console.log("Rota POST /administradores solicitada");

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Campos obrigatórios: username, password" });
  }

  const db = await conectarBD();
  try {
    const result = await db.query(
      "INSERT INTO administrador (username, password) VALUES ($1, $2) RETURNING username",
      [username, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar administrador:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// PUT /administradores/:username - Atualizar administrador
app.put("/administradores/:username", async (req, res) => {
  console.log(`Rota PUT /administradores/${req.params.username} solicitada`);

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Campo obrigatório: password" });
  }

  const db = await conectarBD();
  try {
    const result = await db.query(
      "UPDATE administrador SET password = $1 WHERE username = $2 RETURNING username",
      [password, req.params.username]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar administrador:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// DELETE /administradores/:username - Deletar administrador
app.delete("/administradores/:username", async (req, res) => {
  console.log(`Rota DELETE /administradores/${req.params.username} solicitada`);

  const db = await conectarBD();
  try {
    const result = await db.query("DELETE FROM administrador WHERE username = $1 RETURNING username", [req.params.username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }
    res.json({ message: "Administrador deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar administrador:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// POST /login - Autenticação de administrador
app.post("/login", async (req, res) => {
  console.log("Rota POST /login solicitada");

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Campos obrigatórios: username, password" });
  }

  const db = await conectarBD();
  try {
    const result = await db.query("SELECT * FROM administrador WHERE username = $1 AND password = $2", [username, password]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    res.json({ message: "Login bem-sucedido", admin: result.rows[0] });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    db.end();
  }
});

// ######
// Local onde o servidor escutar as requisições que chegam
// ######
app.listen(port, () => {
  console.log(`Serviço rodando na porta:  ${port}`);
});
