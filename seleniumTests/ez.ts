import {Builder, Capabilities, WebDriver, Session} from 'selenium-webdriver';
import { expect } from 'chai';
import { driver } from 'mocha-webdriver';
import { By } from 'selenium-webdriver';

describe('Test1', function () {

    it('cant take test twice', async function() {
        this.timeout(30000)
        /* log in as someone strange */
        await driver.get('http://localhost:3000/login');
        await driver.find('input[name=login]').sendKeys('vnywbnzoepogyebg');
        await driver.find('input[name=passw]').sendKeys('wowowowo');
        await driver.find('input[type=submit]').doClick();
        let url = await driver.getCurrentUrl();
        /* check if logged */
        expect(url).to.equal('http://localhost:3000/login')

        /* try to take the quiz two times (first time was eariler maybe, need to check)*/        
        await driver.get('http://localhost:3000/quiz1');
        await driver.sleep(3000);

        /* check if the quiz can be solved now */
        if(await driver.getCurrentUrl() !== 'http://localhost:3000/quiz1') {
            if((await driver.findElement(By.tagName('h1')).getText()) === 'You have already solved this quiz') {
                return  // quiz was taken before
            }
        }
        /* take the quiz now */
        await driver.findElement({id:'start'}).doClick();
        await driver.find('input[type=text]').sendKeys('58');
        for(let i=0;i<3;i++) {
            await driver.sleep(1000);
            await driver.findElement({id:'next'}).doClick();
            await driver.find('input[type=text]').sendKeys('58');
        }
        await driver.findElement({id:'stop'}).doClick();
        await driver.sleep(5000);
        await driver.findElement({id:'canc'}).doClick();
        await driver.getCurrentUrl();

        /* now quiz cant be taken for sure */
        await driver.get('http://localhost:3000/quiz1');
        await driver.sleep(5000);
        expect(await driver.getCurrentUrl()).to.not.equal('http://localhost:3000/quiz1')
    
    });

})
