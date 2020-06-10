import { expect } from "chai";
import "mocha";
const fetch = require("node-fetch");

describe("Twice", () => {

    it("cant take test twice", async () => {
        /* variable to check if it is OK */
        let code = 10000
        /* set values of session etc */
        let body0 = {
            login: 'AAAAAAAAAAAAAAAAAA',
            passw: 'AAAAAAAAAAAAAAAAAAA'
        }
        let  body1 = {
            answer: [ '1', '1', '1', '1' ],
            stats: [ '25%', '25%', '25%', '25%' ],
            startTime: new Date()
          }

        await fetch('https://localhost:3000/login', {
            method: 'POST',
            body: JSON.stringify(body0)
        }).then((res) => {
            console.log(res)
        })

        /* save results of user with id 117809 with POST,
           normal user cant send POST without taking the test*/
        await fetch('http://localhost:3000/quiz1', {
            method: 'POST',
            body: JSON.stringify(body1)
        }).then((res) => {
            console.log(res)
        })

        /* Try take quiz again GET */
        await fetch('http://localhost:3000/quiz1')
        .then(res => {
            console.log(res.url)
            code = (res.url === '/?mess=You have already solved this quiz') ? 0 : -1
        })

        expect(code).to.equal(0);
    });
/*
    it("can take test for the first time", async () => {
        let code = 0
        await fetch('http://localhost:3000/quiz1')
        .then(res => {
            console.log(res.url)
            code = (res.url === 'http://localhost:3000/login') ? 0 : 1
        })
        .catch(err => {
            code = err
        })
        expect(code).to.equal(0);
    });
*/
});