import {Builder, Capabilities, WebDriver, Session} from 'selenium-webdriver';
import { expect } from 'chai';
import { driver } from 'mocha-webdriver';
import { By } from 'selenium-webdriver';

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