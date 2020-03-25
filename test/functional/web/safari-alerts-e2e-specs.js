import _ from 'lodash';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { SAFARI_CAPS } from '../desired';
import { initSession, deleteSession, MOCHA_TIMEOUT } from '../helpers/session';
import { GUINEA_PIG_PAGE } from './helpers';


chai.should();
chai.use(chaiAsPromised);

describe('safari - alerts', function () {
  this.timeout(MOCHA_TIMEOUT);

  let driver;
  before(async function () {
    const caps = _.defaults({
      safariInitialUrl: GUINEA_PIG_PAGE,
      safariAllowPopups: true,
    }, SAFARI_CAPS);
    driver = await initSession(caps);
  });
  after(async function () {
    await deleteSession();
  });

  it('should accept alert', async function () {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    (await driver.title()).should.include('I am a page title');
  });

  it('should dismiss alert', async function () {
    await driver.elementById('alert1').click();
    await driver.dismissAlert();
    (await driver.title()).should.include('I am a page title');
  });

  it('should get text of alert', async function () {
    await driver.elementById('alert1').click();
    (await driver.alertText()).should.include('I am an alert');
    await driver.dismissAlert();
  });
  it('should not get text of alert that closed', async function () {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    await driver.alertText()
      .should.eventually.be.rejectedWith(/An attempt was made to operate on a modal dialog when one was not open/);
  });
  it('should set text of prompt', async function () {
    await driver.elementById('prompt1').click();
    await driver.alertKeys('of course!');
    await driver.acceptAlert();

    (await driver.elementById('promptVal').getAttribute('value'))
      .should.eql('of course!');
  });
  it('should fail to set text of alert', async function () {
    await driver.elementById('alert1').click();
    await driver.alertKeys('yes I do!')
      .should.eventually.be.rejectedWith(/The alert contains no input fields/);
    await driver.acceptAlert();
  });
  it('should be able to get alert buttons', async function () {
    await driver.elementById('alert1').click();
    await driver.execute('mobile: alert', {action: 'getButtons'});
    await driver.acceptAlert();
  });
  it('should fail to get buttons of alert that closed', async function () {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    await driver.execute('mobile: alert', {action: 'getButtons'})
      .should.eventually.be.rejectedWith(/An attempt was made to operate on a modal dialog when one was not open/);
  });
});
