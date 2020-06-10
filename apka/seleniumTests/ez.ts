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

describe('Test2', function () {

    it('log out after password change', async function() {
        this.timeout(50000)

        /* log in as user1 */
        await driver.get('http://localhost:3000/login');
        await driver.find('input[name=login]').sendKeys('user1');
        await driver.find('input[name=passw]').sendKeys('user1');
        await driver.find('input[type=submit]').doClick();
        let url = await driver.getCurrentUrl();
        expect(url).to.equal('http://localhost:3000/login')
        let log = await driver.findElement(By.tagName('h1')).getText() 
        expect(log).to.not.equal('Not logged')

        /* log in as user1 again using other session*/
        const driver1 = await new Builder().forBrowser('firefox').build();

        await driver1.get('http://localhost:3000/login');
        await driver1.find('input[name=login]').sendKeys('user1');
        await driver1.find('input[name=passw]').sendKeys('user1');
        await driver1.find('input[type=submit]').doClick();
        url = await driver1.getCurrentUrl();
        expect(url).to.equal('http://localhost:3000/login')

        /* change password */
        await driver1.get('http://localhost:3000/repass');
        await driver1.find('input[name=opassw]').sendKeys('user1');
        await driver1.find('input[name=npassw]').sendKeys('newpassw');
        await driver1.find('input[type=submit]').doClick();
        url = await driver1.getCurrentUrl();
        expect(url).to.equal('http://localhost:3000/logout')
        await driver1.quit()

        await driver.sleep(2000)

        /* driver should be logged out */
        await driver.get('http://localhost:3000/');
        await driver.get('http://localhost:3000/login');
        await driver.sleep(1000);
        log = await driver.findElement(By.tagName('h1')).getText() 
        expect(log).to.equal('Not logged')
    
        /* log in as user1 and save previous password */
        await driver.get('http://localhost:3000/login');
        await driver.find('input[name=login]').sendKeys('user1');
        await driver.find('input[name=passw]').sendKeys('newpassw');
        await driver.find('input[type=submit]').doClick();
        await driver.get('http://localhost:3000/repass');
        await driver.find('input[name=opassw]').sendKeys('newpassw');
        await driver.find('input[name=npassw]').sendKeys('user1');
        await driver.find('input[type=submit]').doClick();
    });

})