let commands = {}, helpers = {}, extensions = {};

commands.getAlertText = async function getAlertText () {
  return await this.proxyCommand('/alert/text', 'GET');
};

commands.setAlertText = async function setAlertText (value) {
  return await this.proxyCommand('/alert/text', 'POST', {value});
};

commands.postAcceptAlert = async function postAcceptAlert (opts = {}) {
  let params = {};
  if (opts.buttonLabel) {
    params.name = opts.buttonLabel;
  }
  return await this.proxyCommand('/alert/accept', 'POST', params);
};

commands.postDismissAlert = async function postDismissAlert (opts = {}) {
  let params = {};
  if (opts.buttonLabel) {
    params.name = opts.buttonLabel;
  }
  return await this.proxyCommand('/alert/dismiss', 'POST', params);
};

commands.getAlertButtons = async function getAlertButtons () {
  return await this.proxyCommand('/wda/alert/buttons', 'GET');
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


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
