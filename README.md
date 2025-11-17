# back-end-api

Este é um projeto web chamado "Achados e Perdidos Local" (ou "Centaurus"), desenvolvido como trabalho final da disciplina de WEB pelos alunos Andrey Paulino Costa, Hugo Barros Correia, João Pedro Almeida Caldeira, Luick Eduardo Neres Costa e Mizael Miranda Barbosa do IFNMG Campus Salinas.

## API URL
https://back-end-tf-web-silk.vercel.app/

## Endpoints da API

### 1. Raiz
- **GET /** - Retorna informações sobre a API e status do banco de dados
- **Resposta:**
```json
{
  "descricao": "API para plataforma de objetos perdidos no IFNMG-Campus Salinas",
  "autor": "Andrey Paulino Costa, Hugo Barros Correia, João Pedro Almeida Caldeira, Luick Eduardo Neres Costa, Mizael Miranda Barbosa",
  "statusBD": "ok"
}
```

### 2. Objetos

#### Listar todos os objetos
- **GET /objetos** - Retorna todos os objetos cadastrados
- **Resposta:** Array de objetos

#### Buscar objeto por ID
- **GET /objetos/:id** - Retorna um objeto específico
- **Parâmetros:** id (número)
- **Resposta:** Objeto encontrado ou erro 404

#### Criar novo objeto
- **POST /objetos** - Cadastra um novo objeto
- **Corpo da requisição:**
```json
{
  "titulo": "Carteira preta",
  "descricao": "Carteira encontrada na biblioteca",
  "categoria": "Documentos",
  "local_encontrado": "Biblioteca",
  "contato_whatsapp": "55999999999",
  "contato_instagram": "@usuario",
  "palavra_passe": "senha123",
  "imagem_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```
- **Campos obrigatórios:** titulo, descricao, categoria, local_encontrado, palavra_passe

#### Atualizar objeto
- **PUT /objetos/:id** - Atualiza um objeto existente
- **Parâmetros:** id (número)
- **Corpo da requisição:** Mesmo formato do POST
- **Resposta:** Objeto atualizado ou erro 404

#### Deletar objeto
- **DELETE /objetos/:id** - Remove um objeto
- **Parâmetros:** id (número)
- **Resposta:** Confirmação de exclusão ou erro 404

### 3. Administradores

#### Listar administradores
- **GET /administradores** - Retorna lista de usernames dos administradores
- **Resposta:** Array de objetos com username

#### Buscar administrador por username
- **GET /administradores/:username** - Retorna um administrador específico
- **Parâmetros:** username (string)
- **Resposta:** Objeto com username ou erro 404

#### Criar novo administrador
- **POST /administradores** - Cadastra um novo administrador
- **Corpo da requisição:**
```json
{
  "username": "admin",
  "password": "senha123"
}
```
- **Campos obrigatórios:** username, password

#### Atualizar administrador
- **PUT /administradores/:username** - Atualiza senha de um administrador
- **Parâmetros:** username (string)
- **Corpo da requisição:**
```json
{
  "password": "nova_senha"
}
```
- **Campo obrigatório:** password

#### Deletar administrador
- **DELETE /administradores/:username** - Remove um administrador
- **Parâmetros:** username (string)
- **Resposta:** Confirmação de exclusão ou erro 404

### 4. Autenticação

#### Login de administrador
- **POST /login** - Autentica um administrador
- **Corpo da requisição:**
```json
{
  "username": "admin",
  "password": "senha123"
}
```
- **Resposta de sucesso:**
```json
{
  "message": "Login bem-sucedido",
  "admin": {
    "username": "admin",
    "password": "senha123"
  }
}
```
- **Resposta de erro (401):** Credenciais inválidas
