const sqlite3 = require('sqlite3').verbose();
var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
SQLiteStore = require('connect-sqlite3')(session);
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db = new sqlite3.Database('db');

// Hack to look like node-postgres
// (and handle async / await operation)
db.myQuery = function (sql, params) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.all(sql, params, function (error, rows) {
      if (error)
        reject(error);
      else
        resolve(rows);
    });
  });
};

db.myRun = function (sql) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.run(sql, function (error) {
      if (error)
        reject(error);
      else
        resolve();
    });
  });
};

var app = express()

var ses = {
  store: new SQLiteStore(),
  secret: 'vndfovnb',
  resave: false,
  saveUninitialized: false,
};

app.use(session(ses));


ses.store.db.myQuery = function (sql, params) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.all(sql, params, function (error, rows) {
      if (error)
        reject(error);
      else
        resolve(rows);
    });
  });
};

ses.store.db.myRun = function (sql) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.run(sql, function (error) {
      if (error)
        reject(error);
      else
        resolve();
    });
  });
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', async (req, res) => {
  res.render('index', {message: req.query.mess})
})

app.get('/quiz:quizID', async function(req, res) {
  if(req.session.logged !== true) {
    res.redirect('/login');
  } else {
    const rows0 = await db.myQuery('SELECT * FROM usersResult where userID='+req.session.userID)
    if(rows0.length !== 0) {
      res.redirect('/?mess=You have already solved this quiz')
      return
    }
    let json = { id : req.params.quizID, question : [], expect : [], penalty : []}
    const rows1 = await db.myQuery('SELECT * FROM tests WHERE testID='+req.params.quizID)
    const rows2 = await db.myQuery('SELECT intro FROM intros WHERE testID = '+req.params.quizID)
    let question = []
    let expect = []
    let penalty = []
    rows1.forEach((x) => {
      question[parseInt(x.nr)] = x.question
      expect[parseInt(x.nr)] = x.expect
      penalty[parseInt(x.nr)] = x.penalty
    });
    json.question = question;
    json.expect = expect;
    json.penalty = penalty;
    json.intro = rows2[0].intro;
    res.render('quiz', {json : json});
  }
})

app.get('/result', async function (req, res) {
  if(req.session.logged !== true) {
    res.redirect('/login')
    return
  }  
  const rows = await db.myQuery('SELECT testID FROM usersResult WHERE userID='+req.session.userID)
  res.render('result', {tests : rows})
})

app.get('/res:quizID', async function (req, res) {
  if(req.session.logged !== true) {
    res.redirect('/login')
    return
  }    
  const rows1 = await db.myQuery('SELECT * FROM usersResponse WHERE \
    userID='+req.session.userID+' and testID='+req.params.quizID+' \
    ORDER BY nr ASC')
  const rows2 = await db.myQuery('SELECT * FROM tests WHERE \
    testID='+req.params.quizID+' ORDER BY nr ASC')
  let strs = []
  for(let i=1; i<= rows1.length; i++) {
    strs[i-1] = i+'. '+rows1[i-1].good+', expected '+rows2[i-1].expect
  }
  const rows3 = await db.myQuery('SELECT result, login FROM \
    (SELECT * FROM usersResult WHERE testID='+req.params.quizID+' ORDER BY result ASC LIMIT 5) res\
    left join users on res.userID = users.userID')
  const rows4 = await db.myQuery('SELECT nr, AVG(sec) as avg FROM \
    usersResponse WHERE testID='+req.params.quizID+' and good="ok" GROUP BY nr')
  res.render('res', {nr: req.params.quizID, strs: strs, top: rows3, avg: rows4})
})

app.get('/login', function (req, res) {
  let str = (req.session.logged !== true) ? "Not logged" : "Logged as "+req.session.login
  res.render('login', {str: str})
})

app.get('/repass', function (req, res) {
  if(req.session.logged !== true) {
    res.redirect('/login');
  } else {
    res.render('repass')
  }
})

app.get('/logout', function (req, res) {
  delete(req.session.login)
  delete(req.session.passw)
  delete(req.session.userID)
  delete(req.session.logged)
  req.session.regenerate(function(err) {
    res.render('logout')
  })
})

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({
  extended: true
}))

async function handleUser(login, passw, npassw) {
  const rows1 = await db.myQuery('SELECT * FROM users WHERE login="'+login+'"');
  if(rows1.length === 0) {
    const rows2 = await db.myQuery('SELECT COUNT(*) as count FROM users');
    await db.myRun('INSERT INTO users VALUES('+rows2[0].count+', "'+login+'", "'+npassw+'")');
    return rows2[0].count
  } else {
    if(rows1[0].passw === passw) {
      if(passw !== npassw)
        await db.myRun('UPDATE users SET passw="'+npassw+'" WHERE userID ='+rows1[0].userID);
      return rows1[0].userID
    } else {
      return -1
    }
  }
}

app.post('/login', async function (req, res) {
  let login = req.body.login
  let passw = req.body.passw
  let id = await handleUser(login, passw, passw)
  if(id === -1) {
    res.redirect('/?mess=Bad password')
  } else {
    req.session.regenerate(function(err) {
      req.session.userID = id
      req.session.login = login
      req.session.passw = passw
      req.session.logged = true
      res.redirect('/login')
    })
  }
})

app.post('/repass', async function (req, res) {
  let login = req.session.login
  let opassw = req.body.opassw
  let npassw = req.body.npassw
  let id = await handleUser(login, opassw, npassw)
  if(id === -1) {
    res.redirect('/?mess=Bad password')
  } else {
    const rows = await ses.store.db.myQuery('SELECT * FROM sessions')
    rows.forEach(async (x) => {
      let y = JSON.parse(x.sess)
      if(y.userID === req.session.userID) {
        await ses.store.db.myRun('DELETE FROM sessions WHERE sid="'+x.sid+'"');
      }
    });
    res.redirect('/logout')
  }
})

/* SEND Z QUIZU, SPRAWDZ QUIZ POKAZ WYNIKI */
app.post('/quiz:quizID', async function (req, res) {
  if(req.session.logged !== true) {
    res.redirect('/login')
  } else {
    const rows = await db.myQuery('SELECT nr, expect, penalty FROM tests WHERE testID='+req.params.quizID+' ORDER BY nr ASC')
    let answer = req.body.answer
    let stats = req.body.stats
    let startTime = req.body.startTime
    let today = new Date();
    let finTime = 60*today.getMinutes() + today.getSeconds();
    let totTime = finTime - startTime
    let realTime = []
    let json = { stats : [], result : 0, penalty : []}
    for(let i=0; i<stats.length; i++) {
      realTime[i] = parseInt(totTime*parseFloat(stats[i])/100)
      json.result += realTime[i]
      json.stats[i] = realTime[i]
      json.penalty[i] = ""
      let bol = ""
      if(parseInt(answer[i]) === rows[i].expect) {
        bol = "ok"
      } else {
        bol = "bad"
        json.penalty[i] = rows[i].penalty
        json.result += rows[i].penalty
      }
      await db.myRun('INSERT OR IGNORE INTO usersResponse \
        VALUES('+req.session.userID+', '+req.params.quizID+', '+i+', '+realTime[i]+', "'+bol+'")')
    }
    await db.myRun('INSERT OR IGNORE INTO usersResult VALUES('+req.session.userID+', '+req.params.quizID+', '+json.result+')')
    res.send(json)
  }
})

/* Pokaz wynik jakos */
app.post('/result:quizID', async function (req, res) {
  if(req.session.logged !== true) {
    res.redirect('/login')
  } else {
    res.redirect('/result')
  }
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

base()

async function base() {

  var jsons = [{
    id: 1,
    question: [
        "1, 2, 5, 12, 27, _ , ...",
        "1, 3, 7, 15, _ , ...",
        "1, 1, 2, 3, 5, 8, _ , ...",
        "5, 8, 15, 34, _ , ..."
    ],
    expect: [
        58,
        31,
        13,
        89
    ],
    penalty: [
        40,
        30,
        15,
        60
    ],
    intro: "\nInstruction:\n\n\Guess what number should be in the blank space('_')."
  }]

  await db.myRun('CREATE TABLE IF NOT EXISTS intros(testID INT PRIMARY KEY, intro VARCHAR(255))')
  await db.myRun('CREATE TABLE IF NOT EXISTS tests\
  (testID INT, nr INT, question VARCHAR(255), expect INT, penalty INT, PRIMARY KEY(testID, nr))')
  await db.myRun('CREATE TABLE IF NOT EXISTS users(userID INT PRIMARY KEY, login VARCHAR(20), passw VARCHAR(20))')
  await db.myRun('CREATE TABLE IF NOT EXISTS usersResult \
  (userID INT, testID INT, result INT, PRIMARY KEY(userID, testID))')
  await db.myRun('CREATE TABLE IF NOT EXISTS usersResponse\
  (userID INT, testID INT, nr INT, sec INT, good VARCHAR(5), PRIMARY KEY(userID, testID, nr))')

  var x

  for (x of jsons) {
    await db.myRun('INSERT OR IGNORE INTO intros VALUES('+x.id+', "'+x.intro+'")')
    let i = 0;
    while(i < x.question.length) {
      await db.myRun('INSERT OR IGNORE INTO tests VALUES('+x.id+', '+i+', "'+x.question[i]+'", '+x.expect[i]+', '+x.penalty[i]+')')
      i++;
    }
  }
}

