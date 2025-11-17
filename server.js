// ######
// Local onde os pacotes de dependências serão importados
// ######
import express from "express";      // Requisição do pacote do express

// ######
// Local onde as configurações do servidor serão feitas
// ######
const app = express();              // Instancia o Express
const port = 3000;                  // Define a porta

// ######
// Local onde as rotas (endpoints) serão definidas
// ######
app.get("/", (req, res) => {
  // Rota raiz do servidor
  // Rota GET /
  // Esta rota é chamada quando o usuário acessa a raiz do servidor
  // Ela retorna uma mensagem com informações do projeto

  console.log("Rota GET / solicitada"); // Log no terminal para indicar que a rota foi acessada

  // Responde com um JSON contendo uma mensagem
  res.json({
		descricao: "API para plataforma de objetos perdidos no IFNMG-Campus Salinas",
    autor: "Andrey Paulino Costa, Hugo Barros Correia, João Pedro Almeida Caldeira, Luick Eduardo Neres Costa, Mizael Miranda Barbosa",
  });
});

// ######
// Local onde o servidor escutar as requisições que chegam
// ######
app.listen(port, () => {
  console.log(`Serviço rodando na porta:  ${port}`);
});
