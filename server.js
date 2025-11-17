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
app.use(express.json());            // Middleware para interpretar requisições com corpo em JSON

// ######
// Local onde funções serão definidas
// ######

function conectarBD() {
  return new Pool({
    connectionString: process.env.URL_BD,
  });
}

// ######
// Local onde as rotas (endpoints) serão definidas
// ######
app.get("/", async (req, res) => {
  // Rota raiz do servidor
  // Rota GET /
  // Esta rota é chamada quando o usuário acessa a raiz do servidor
  // Ela retorna uma mensagem com informações do projeto

  console.log("Rota GET / solicitada"); // Log no terminal para indicar que a rota foi acessada

  const db = conectarBD();

  let dbStatus = "ok";

  // Testa a conexão com o banco
  try {
    await db.query("SELECT 1");
  } catch (e) {
    dbStatus = e.message;
  }

  // Responde com um JSON contendo uma mensagem
  res.json({
		descricao: "API para plataforma de objetos perdidos no IFNMG-Campus Salinas",
    autor: "Andrey Paulino Costa, Hugo Barros Correia, João Pedro Almeida Caldeira, Luick Eduardo Neres Costa, Mizael Miranda Barbosa",
    statusBD: dbStatus              // Informa se a conexão com o banco de dados foi bem-sucedida ou mostra o erro.
  });
});

// GET /objetos - Retorna todos os objetos
app.get("/objetos", async (req, res) => {
  console.log("Rota GET /objetos solicitada");

  const db = conectarBD();

  try {
    const resultado = await db.query("SELECT * FROM Objeto");
    const dados = resultado.rows;
    res.json(dados);
  } catch (e) {
    console.error("Erro ao buscar objetos:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// GET /objetos/:id - Retorna um objeto específico pelo ID
app.get("/objetos/:id", async (req, res) => {
  console.log("Rota GET /objetos/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const consulta = "SELECT * FROM Objeto WHERE id = $1";
    const resultado = await db.query(consulta, [id]);
    const dados = resultado.rows;

    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Objeto não encontrado" });
    }

    res.json(dados);
  } catch (e) {
    console.error("Erro ao buscar objeto:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// POST /objetos - Cria um novo objeto
app.post("/objetos", async (req, res) => {
  console.log("Rota POST /objetos solicitada");

  try {
    const data = req.body;

    // Validação dos dados recebidos
    if (!data.titulo || !data.categoria || !data.local || !data.palavraPasse) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem: "Todos os campos obrigatórios (titulo, categoria, local, palavraPasse) devem ser fornecidos.",
      });
    }

    const db = conectarBD();

    // Calcular data de expiração (3 meses a partir de hoje)
    const dataExpiracao = new Date();
    dataExpiracao.setMonth(dataExpiracao.getMonth() + 3);

    const consulta = `INSERT INTO Objeto (titulo, descricao, categoria, local, dataRegistro, dataExpiracao, foto, palavraPasse, contatoInstagram, contatoWhatsapp, denuncia, statusDenuncia)
                      VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, FALSE, FALSE)`;
    const valores = [
      data.titulo,
      data.descricao || null,
      data.categoria,
      data.local,
      dataExpiracao.toISOString().split('T')[0], // Formato YYYY-MM-DD
      data.foto || null,
      data.palavraPasse,
      data.contatoInstagram || null,
      data.contatoWhatsapp || null
    ];

    await db.query(consulta, valores);
    res.status(201).json({ mensagem: "Objeto criado com sucesso!" });
  } catch (e) {
    console.error("Erro ao inserir objeto:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// PUT /objetos/:id - Atualiza um objeto existente
app.put("/objetos/:id", async (req, res) => {
  console.log("Rota PUT /objetos/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();

    // Verificar se o objeto existe
    let consulta = "SELECT * FROM Objeto WHERE id = $1";
    let resultado = await db.query(consulta, [id]);
    let objeto = resultado.rows;

    if (objeto.length === 0) {
      return res.status(404).json({ mensagem: "Objeto não encontrado" });
    }

    const data = req.body;

    // Usar valores enviados ou manter os atuais
    const titulo = data.titulo || objeto[0].titulo;
    const descricao = data.descricao !== undefined ? data.descricao : objeto[0].descricao;
    const categoria = data.categoria || objeto[0].categoria;
    const local = data.local || objeto[0].local;
    const foto = data.foto !== undefined ? data.foto : objeto[0].foto;
    const contatoInstagram = data.contatoInstagram !== undefined ? data.contatoInstagram : objeto[0].contatoinstagram;
    const contatoWhatsapp = data.contatoWhatsapp !== undefined ? data.contatoWhatsapp : objeto[0].contatowhatsapp;

    // Atualizar o objeto
    consulta = "UPDATE Objeto SET titulo = $1, descricao = $2, categoria = $3, local = $4, foto = $5, contatoInstagram = $6, contatoWhatsapp = $7 WHERE id = $8";
    await db.query(consulta, [titulo, descricao, categoria, local, foto, contatoInstagram, contatoWhatsapp, id]);

    res.status(200).json({ mensagem: "Objeto atualizado com sucesso!" });
  } catch (e) {
    console.error("Erro ao atualizar objeto:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// DELETE /objetos/:id - Exclui um objeto
app.delete("/objetos/:id", async (req, res) => {
  console.log("Rota DELETE /objetos/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();

    // Verificar se o objeto existe
    let consulta = "SELECT * FROM Objeto WHERE id = $1";
    let resultado = await db.query(consulta, [id]);
    let dados = resultado.rows;

    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Objeto não encontrado" });
    }

    // Excluir o objeto
    consulta = "DELETE FROM Objeto WHERE id = $1";
    await db.query(consulta, [id]);

    res.status(200).json({ mensagem: "Objeto excluído com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir objeto:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// GET /administradores - Retorna todos os administradores
app.get("/administradores", async (req, res) => {
  console.log("Rota GET /administradores solicitada");

  const db = conectarBD();

  try {
    const resultado = await db.query("SELECT username FROM Administrador");
    const dados = resultado.rows;
    res.json(dados);
  } catch (e) {
    console.error("Erro ao buscar administradores:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// GET /administradores/:username - Retorna um administrador específico
app.get("/administradores/:username", async (req, res) => {
  console.log("Rota GET /administradores/:username solicitada");

  try {
    const username = req.params.username;
    const db = conectarBD();
    const consulta = "SELECT username FROM Administrador WHERE username = $1";
    const resultado = await db.query(consulta, [username]);
    const dados = resultado.rows;

    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Administrador não encontrado" });
    }

    res.json(dados);
  } catch (e) {
    console.error("Erro ao buscar administrador:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// POST /administradores - Cria um novo administrador
app.post("/administradores", async (req, res) => {
  console.log("Rota POST /administradores solicitada");

  try {
    const data = req.body;

    // Validação dos dados recebidos
    if (!data.username || !data.password) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem: "Username e password são obrigatórios.",
      });
    }

    const db = conectarBD();

    const consulta = "INSERT INTO Administrador (username, password) VALUES ($1, $2)";
    const valores = [data.username, data.password];

    await db.query(consulta, valores);
    res.status(201).json({ mensagem: "Administrador criado com sucesso!" });
  } catch (e) {
    console.error("Erro ao inserir administrador:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// PUT /administradores/:username - Atualiza um administrador
app.put("/administradores/:username", async (req, res) => {
  console.log("Rota PUT /administradores/:username solicitada");

  try {
    const username = req.params.username;
    const db = conectarBD();

    // Verificar se o administrador existe
    let consulta = "SELECT * FROM Administrador WHERE username = $1";
    let resultado = await db.query(consulta, [username]);
    let admin = resultado.rows;

    if (admin.length === 0) {
      return res.status(404).json({ mensagem: "Administrador não encontrado" });
    }

    const data = req.body;

    // Usar valor enviado ou manter o atual
    const password = data.password || admin[0].password;

    // Atualizar o administrador
    consulta = "UPDATE Administrador SET password = $1 WHERE username = $2";
    await db.query(consulta, [password, username]);

    res.status(200).json({ mensagem: "Administrador atualizado com sucesso!" });
  } catch (e) {
    console.error("Erro ao atualizar administrador:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// DELETE /administradores/:username - Exclui um administrador
app.delete("/administradores/:username", async (req, res) => {
  console.log("Rota DELETE /administradores/:username solicitada");

  try {
    const username = req.params.username;
    const db = conectarBD();

    // Verificar se o administrador existe
    let consulta = "SELECT * FROM Administrador WHERE username = $1";
    let resultado = await db.query(consulta, [username]);
    let dados = resultado.rows;

    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Administrador não encontrado" });
    }

    // Excluir o administrador
    consulta = "DELETE FROM Administrador WHERE username = $1";
    await db.query(consulta, [username]);

    res.status(200).json({ mensagem: "Administrador excluído com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir administrador:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// POST /login - Autenticação de administrador
app.post("/login", async (req, res) => {
  console.log("Rota POST /login solicitada");

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem: "Username e password são obrigatórios.",
      });
    }

    const db = conectarBD();
    const consulta = "SELECT * FROM Administrador WHERE username = $1 AND password = $2";
    const resultado = await db.query(consulta, [username, password]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({ mensagem: "Credenciais inválidas" });
    }

    res.json({ mensagem: "Login realizado com sucesso!", admin: resultado.rows[0] });
  } catch (e) {
    console.error("Erro ao fazer login:", e);
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

// ######
// Local onde o servidor escutar as requisições que chegam
// ######
app.listen(port, () => {
  console.log(`Serviço rodando na porta:  ${port}`);
});
