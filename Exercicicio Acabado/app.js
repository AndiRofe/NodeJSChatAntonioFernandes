'use strict';

var express = require('express'), aplicacao = express();
var http = require('http').Server(aplicacao);
var socket = require('socket.io')(http);
var bodyParser = require("body-parser");


aplicacao.use(bodyParser.urlencoded({
    extended: true
}));
aplicacao.use(bodyParser.json());

var utilizadores = [];
utilizadores.push({ 'nome': 'antonio', 'password': 123, 'conectado': 0 });
utilizadores.push({ 'nome': 'teste', 'password': 123, 'conectado': 0 });

aplicacao.get('/registar', function (req, res) {
    res.sendFile(__dirname + '/registar.html');
});

aplicacao.get('/', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

aplicacao.get('/chat', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

aplicacao.post('/', function (req, res) {
});

aplicacao.post('/registar', function (req, res) {

});


socket.on('connection', function (cliente) {

    function getOnline() {
        var usersOnline = [];

        utilizadores.forEach(function (x) {
            if (x.conectado == 1) {
                usersOnline.push(x);
            }
        });

    }
    getOnline();

    cliente.on('entrouNoChat', function (req) {

        utilizadores.forEach(function (x) {
            if (x.nome == req.nome) {
                x.id = cliente.client.id;
                return;
            }
        });

        cliente.client.username = req.nome;

        cliente.broadcast.emit('mensagemGeralEntrou', cliente.client.username);

    });
    cliente.on('fazerRegisto', function (dados) {

    var nome = dados.nome;
    var password = dados.password;

    utilizadores.forEach(function (x) {
        if (x.nome == nome) { 
            console.log("Utilizador já existe!");
        }
        else {
            utilizadores.push(
                {
                    'nome': nome,
                    'password': password,
                    'conectado': 0
                });

            console.log("Utilizador Criado");
            console.log(utilizadores);

            socket.emit('entrarLogin');
        }
    });
    }
    )
    
    cliente.on('fazerLogin', function (dados) {
        var nome = dados.nome;
        var password = dados.password;
        var logado = 0;

        utilizadores.forEach(function (x) {
            if (x.nome == nome && x.password == password) {

                x.conectado = 1;
                console.log("Utilizador logado: " + x.nome);
                logado = 1;
        
                socket.emit('entrarChat', { nome: nome });
            }

        });
        if (logado == 0) {
            socket.emit('erroLogin');
        }
    })

    cliente.on('disconnect', function () {

        console.log(utilizadores);

        utilizadores.forEach(function (x) {
            if (x.nome == cliente.client.username) {
                x.conectado = 0;
            }
        });

        console.log('O utilizador ' + cliente.client.username + ' saiu!');

        cliente.broadcast.emit('mensagemGeralSaiu', cliente.client.username);
        console.log(utilizadores);

    })

    cliente.on('envioMensagem', function (req) {

        var msg1 = req.nome + ': ' + req.msg;
        console.log(msg1);

        utilizadores.forEach(function (x) {
            if (x.nome == req.nome) {
                return;
            }
            else {
                socket.to(x.id).emit('envioMensagemUser', msg1);
            }
        });

    });

    cliente.on('mensagensPrivadas', function (dados) {

        var msg = dados.msg;
        var userDestino = dados.userDestino;
        var userDestinoId;

        utilizadores.forEach(function (x) {
            if (x.nome == userDestino) {
                userDestinoId = x.id;
            }
        });

        socket.to(userDestinoId).emit('mensagemPrivadaUser', { msg: msg, user: cliente.client.username });

    });

    cliente.on("escrevendo", function () {
        cliente.broadcast.emit("utilizadorescrevendo", { utilizador: cliente.client.username });
    });

    cliente.on("parouEscrever", function () {
        cliente.broadcast.emit("parouEscrever");
    });
});

http.listen(5000, function () {
    console.log('À espera de ligações na porta: 5000');
});