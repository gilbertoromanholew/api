import express from 'express';
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const users = []

app.post('/users', (req, res) => {
    users.push(req.body);
    res.status(201).json(req.body);
});

app.get('/users', (req, res) => {
    res.status(200).json(users);
});

app.listen(3000);


/*

CTRL + C faz o servidor parar
Para iniciar o servidor novamente, use o comando `node server.js`

Formas de enviar dados para o servidor:

Query, Route e Body Params

Query Params: ?name=John & age=30
Route Params: /users/123
Body Params: { "name": "John", "age": 30 } # Este é o que estou usando no exemplo

*/