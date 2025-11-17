# back-end-tf-api

Este é um projeto web chamado "Achados e Perdidos Local" (ou "Centaurus"), desenvolvido como trabalho final da disciplina de WEB pelos alunos Andrey Paulino Costa, Hugo Barros Correia, João Pedro Almeida Caldeira, Luick Eduardo Neres Costa e Mizael Miranda Barbosa do IFNMG Campus Salinas.

## URL da API
https://back-end-api-tau.vercel.app

## Endpoints da API

### Objetos

**[GET] /objetos**
Descrição: Retorna todos os objetos cadastrados no sistema.

**[GET] /objetos/{id}**
Descrição: Retorna um objeto específico pelo ID.

**[POST] /objetos**
Descrição: Cadastra um novo objeto encontrado.

Body:
```json
{
  "titulo": "Título do objeto",
  "descricao": "Descrição detalhada",
  "categoria": "Categoria do objeto",
  "local": "Local onde foi encontrado",
  "palavraPasse": "Senha para exclusão",
  "foto": "URL da foto (opcional)",
  "contatoInstagram": "@usuario_instagram (opcional)",
  "contatoWhatsapp": "11999999999 (opcional)"
}
```

**[PUT] /objetos/{id}**
Descrição: Atualiza os dados de um objeto existente.

Body:
```json
{
  "titulo": "Novo título (opcional)",
  "descricao": "Nova descrição (opcional)",
  "categoria": "Nova categoria (opcional)",
  "local": "Novo local (opcional)",
  "foto": "Nova URL da foto (opcional)",
  "contatoInstagram": "Novo @usuario (opcional)",
  "contatoWhatsapp": "Novo número (opcional)"
}
```

**[DELETE] /objetos/{id}**
Descrição: Exclui um objeto do sistema.

### Administradores

**[GET] /administradores**
Descrição: Retorna todos os administradores cadastrados (apenas usernames).

**[GET] /administradores/{username}**
Descrição: Retorna um administrador específico pelo username.

**[POST] /administradores**
Descrição: Cadastra um novo administrador.

Body:
```json
{
  "username": "nome_usuario",
  "password": "senha_admin"
}
```

**[PUT] /administradores/{username}**
Descrição: Atualiza a senha de um administrador.

Body:
```json
{
  "password": "nova_senha"
}
```

**[DELETE] /administradores/{username}**
Descrição: Exclui um administrador do sistema.

### Autenticação

**[POST] /login**
Descrição: Realiza login de administrador.

Body:
```json
{
  "username": "nome_usuario",
  "password": "senha_admin"
}
```

**[GET] /**
Descrição: Retorna informações básicas da API e status da conexão com o banco de dados.
