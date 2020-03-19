import { errors } from 'appium-base-driver';
import { util } from 'appium-support';
import _ from 'lodash';

let commands = {}, helpers = {}, extensions = {};

commands.getAlertText = async function getAlertText () {
  if (this.isWebContext()) {
    const alert = await this.getAlert();
    return await alert.getText();
  }

  return await this.proxyCommand('/alert/text', 'GET');
};

commands.setAlertText = async function setAlertText (value) {
  if (_.isString(value)) {
    value = value.split('');
  }

  if (this.isWebContext()) {
    const alert = await this.getAlert();
    return await alert.setText(value);
  }

  return await this.proxyCommand('/alert/text', 'POST', {value});
};

commands.postAcceptAlert = async function postAcceptAlert (opts = {}) {
  if (this.isWebContext()) {
    const alert = await this.getAlert();
    if (alert.close) {
      return await alert.close();
    }
    return await alert.ok();
  }

  let params = {};
  if (opts.buttonLabel) {
    params.name = opts.buttonLabel;
  }
  return await this.proxyCommand('/alert/accept', 'POST', params);
};

commands.postDismissAlert = async function postDismissAlert (opts = {}) {
  if (this.isWebContext()) {
    const alert = await this.getAlert();
    if (alert.close) {
      return await alert.close();
    }
    return await alert.cancel();
  }

  let params = {};
  if (opts.buttonLabel) {
    params.name = opts.buttonLabel;
  }
  return await this.proxyCommand('/alert/dismiss', 'POST', params);
};

commands.getAlertButtons = async function getAlertButtons () {
  try {
    return await this.proxyCommand('/wda/alert/buttons', 'GET');
  } catch (err) {
    throw new errors.NoAlertOpenError();
  }
};

commands.mobileHandleAlert = async function mobileHandleAlert (opts = {}) {
  switch (opts.action) {
    case 'accept':
      return await this.postAcceptAlert(opts);
    case 'dismiss':
      return await this.postDismissAlert(opts);
    case 'getButtons':
      return await this.getAlertButtons();
    default:
      throw new Error(`The 'action' value should be either 'accept', 'dismiss' or 'getButtons'. ` +
                      `'${opts.action}' is provided instead.`);
  }
};

helpers.getAlert = async function getAlert () {
  const getAlertElements = async (className) => await this.findNativeElementOrElements('-ios class chain',
    `**/XCUIElementTypeScrollView/**/${className}`, true);

  // the alert ought to be the first scroll view
  // within the alert there should be one or two buttons (no more, no less)
  const possibleAlertButtons = await getAlertElements('XCUIElementTypeButton');
  if (possibleAlertButtons.length < 1 || possibleAlertButtons.length > 2) {
    throw new errors.NoAlertOpenError();
  }

  // determine that the name of the button is what is expected
  const assertButtonName = async (button, expectedName = '') => {
    button = util.unwrapElement(button);
    const name = await this.proxyCommand(`/element/${button}/attribute/name`, 'GET');
    if (name?.toLowerCase() !== expectedName.toLowerCase()) {
      throw new errors.NoAlertOpenError();
    }
  };

  // artificial 'alert' object, on which we will put functions for interacting
  let alert = {};

  if (possibleAlertButtons.length === 1) {
    // make sure the button is 'Close'
    const closeButton = possibleAlertButtons[0];
    await assertButtonName(closeButton, 'close');

    // add a function on the alert to close by clicking the 'Close' button
    alert.close = async () => {
      await this.proxyCommand(`/element/${util.unwrapElement(closeButton)}/click`, 'POST');
    };
  } else {
    // ensure the buttons are 'Cancel' and 'OK'
    const firstButton = possibleAlertButtons[0];
    await assertButtonName(firstButton, 'cancel');
    const secondButton = possibleAlertButtons[1];
    await assertButtonName(secondButton, 'ok');

    // add cancel function to the alert, clicking the 'Cancel' button
    alert.cancel = async () => {
      await this.proxyCommand(`/element/${util.unwrapElement(firstButton)}/click`, 'POST');
    };
    // add ok function to the alert, clicking the 'OK' button
    alert.ok = async () => {
      await this.proxyCommand(`/element/${util.unwrapElement(secondButton)}/click`, 'POST');
    };
  }

  // add getText function to the alert, getting the value of the correct element
  alert.getText = async () => {
    // iOS up to 13.3 will report a single text view, while 13.4 will have two
    // but the _last_ one will be the one presenting the text of the alert
    const textViews = await getAlertElements('XCUIElementTypeTextView');
    return await this.proxyCommand(`/element/${util.unwrapElement(_.last(textViews))}/attribute/value`, 'GET');
  };
  // add setText function to the alert, setting the value of the text field element
  alert.setText = async (value) => {
    const textFields = await getAlertElements('XCUIElementTypeTextField');
    if (textFields.length === 0) {
      throw new Error('Tried to set text of an alert that was not a prompt');
    }
    await this.proxyCommand(`/element/${util.unwrapElement(_.first(textFields))}/value `, 'POST', {value});
  };

  return alert;
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
