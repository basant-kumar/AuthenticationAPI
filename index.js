const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const port = 7050;
const secretKeyForJWT = "FDaFdsFDafsFdasfFDSAsd";

const userData = [];

app.get('/', (req, res)=>{
    // console.log(req.body);
    res.send('Hello World!, this is the home page');
});


app.post('/login', (req, res)=>{
    //sanity check - does the input contains the required information
    const {error} = ValidateLoginInput(req);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    }

    //check whether the given username and password exists in database
    const user = userData.find( u => {return u.username === req.body.username});
    if(user){
        res.status(400).send('Username already exist!');
        return;
    }

    //return 400 if usernamd or password is incorrect
    const user = userData.find( u => {return u.username === req.body.username && u.password === req.body.password});
    if(!user){
        res.status(400).send('Entered username or password is incorrect');
        return;
    }

    //build jwt token
    const payload = {
        "username" : req.body.username
    };

    const token = jwt.sign(payload, secretKeyForJWT, {expiresIn : 60*60});
    res.json({token});
});

app.post('/register', (req, res)=>{
    //validate input
    const {error} = ValidateInput(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    }
    // check for duplicate username
    const user = userData.find( u => {return u.username === req.body.username});
    if(!user){
        res.status(400).send('Username already exist!');
        return;
    }
    
    const user = {
        'username' : req.body.username,
        'password' : req.body.password,
        'name' : req.body.name,
        'college' : req.body.college,
        'yearOfGraduation' : req.body.yearOfGraduation
    };

    userData.push(user);

    res.send({message : 'Successfully registered'});

});

app.get('/profiles', (req, res)=>{
    const userDataDeepCopy =  JSON.parse(JSON.stringify(userData));
    for(user in userDataDeepCopy){
        delete userDataDeepCopy[user].password;
    }
    res.json(userDataDeepCopy);
});

app.put('/profiles', (req, res)=>{
    //check for valid input
    const {error} = ValidateInput(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    }
    //check for username and password
    let isValid=false;
    let idx = -1;
    for(let i = 0; i < userData.length; ++i){
        const currentUser = userData[i];
        if(currentUser.username === req.body.username && currentUser.password === req.body.password){
            isValid = true;
            idx = i;
        }
    }

    if(!isValid){
        res.status(401).json({message : 'Invalid username or password'});
        return;
    }
    else{
        userData[idx].name = req.body.name;
        userData[idx].college = req.body.college;
        userData[idx].yearOfGraduation = req.body.yearOfGraduation;
        res.json({message : 'User data updated'});
    }
})

app.listen(port, () => {
    console.log(`Listening on port:  ${port}`);
});


function ValidateInput(input){
    const  schema = Joi.object({
        username : Joi.string().min(3).required(),
        password : Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9]')),
        name : Joi.string().min(3).required(),
        college: Joi.string().min(3),
        yearOfGraduation : Joi.number().integer().min(1990).max(2050)
    });
    return schema.validate(input);

}

function ValidateLoginInput(input){
    const schema = Joi.object({
        username : Joi.string.min(3).required(),
        password : Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9]'))
    });
    return schema.validate(input);
}