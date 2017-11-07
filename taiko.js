const puppeteer = require('puppeteer');

let b, p;

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.
 *
 * @param {Object} options - Set of configurable [options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions) to set on the browser.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const openBrowser = async options => {
    b = await puppeteer.launch(options);
    p = await b.newPage();
    return { description: 'Browser and page initialized' };
};

/**
 * Closes the browser and all of its tabs (if any were opened).
 *
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const closeBrowser = async () => {
    validate();
    await b.close();
    b, p = null;
    return { description: 'Browser and page closed' };
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the url if not present.
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options - [Navigation parameters](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagegotourl-options)
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
const goto = async (url, options) => {
    validate();
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    await p.goto(url, options);
    return { description: `Navigated to url "${p.url()}"`, url: p.url() };
};

/**
 * Reloads the page.
 *
 * @param {Object} options - [Navigation parameters](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagereloadoptions)
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
const reload = async options => {
    validate();
    await p.reload(options);
    return { description: `"${p.url()}" reloaded`, url: p.url() };
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.
 *
 * Examples:
 * ```
 * click('Get Started')
 * click(link('Get Started'))
 * click('Get Started', waitForNavigation(false))
 * ```
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {boolean} [waitForNavigation=true] - wait for navigation after the click.
 * @param {Object} options - click options.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.number=1] - number of times to click on the element.
 * @param {number} [options.delay=0] - Time to wait between mousedown and mouseup in milliseconds.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const click = async (selector, waitForNavigation = true, options = {}) => {
    validate();
    const e = await element(selector);
    await e.click(options);
    await e.dispose();
    if (waitForNavigation) await p.waitForNavigation();
    return { description: 'Clicked ' + description(selector, true) };
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error.
 *
 * Examples:
 * ```
 *  doubleClick('Get Started')
 *  doubleClick(button('Get Started'))
 *  doubleClick('Get Started', waitForNavigation(false))
 * ```
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {boolean} [waitForNavigation=true] - wait for navigation after the click.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const doubleClick = async (selector, waitForNavigation = true) => {
    validate();
    await click(selector, waitForNavigation, { clickCount: 2, });
    return { description: 'Double clicked ' + description(selector, true) };
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then right clicks the element. If there's no element matching selector, the method throws an error.
 *
 * Examples:
 * ```
 *  rightClick('Get Started')
 *  rightClick(text('Get Started'))
 * ```
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {boolean} [waitForNavigation=true] - wait for navigation after the click.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const rightClick = async (selector) => {
    validate();
    await click(selector, false, { button: 'right', });
    return { description: 'Right clicked ' + description(selector, true) };
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error.
 *
 * Examples:
 * ```
 *  hover('Get Started')
 *  hover(link('Get Started'))
 * ```
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be hovered.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const hover = async selector => {
    validate();
    const e = await element(selector);
    await e.hover();
    await e.dispose();
    return { description: 'Hovered over the ' + description(selector, true) };
};

/**
 * Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error.
 *
 * Examples:
 * ```
 *  focus(textField('Username:'))
 * ```
 * @param {selector|string} selector - A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const focus = async selector => {
    validate();
    await (await _focus(selector)).dispose();
    return { description: 'Focussed on the ' + description(selector, true) };
};

/**
 * Types the given text into the focused or given element.
 *
 * Examples:
 * ```
 *  write('admin', into('Username:'))
 *  write('admin', 'Username:')
 *  write('admin')
 * ```
 * @param {string} text - Text to type into the element.
 * @param {selector|string} [into] - A selector of an element to write into.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const write = async (text, into) => {
    validate();
    if (into) {
        const selector = isString(into) ? textField(into) : into;
        const e = await _focus(selector);
        await e.type(text);
        await e.dispose();
        return { description: `Wrote ${text} into the ` + description(selector, true) };
    } else {
        p.keyboard.type(text);
        return { description: `Wrote ${text} into the focused element.` };
    }
};

/**
 * Uploads a file to a file input element.
 *
 * Examples:
 * ```
 *  upload('c:/abc.txt', to('Please select a file:'))
 *  upload('c:/abc.txt', 'Please select a file:')
 * ```
 * @param {string} filepath - The path of the file to be attached.
 * @param {selector|string} to - The file input element to which to upload the file.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const upload = async (filepath, to) => {
    validate();
    if (isString(to)) to = {
        get: async () => $xpath(`//input[@type='file'][@id=(//label[contains(text(),'${to}')]/@for)]`),
        description: `File input field with label containing "${to}"`,
    };
    else if (!isSelector(to)) throw Error('Invalid element passed as paramenter');
    const e = await to.get();
    await e.uploadFile(filepath);
    await e.dispose();
    return { description: `Uploaded ${filepath} to the ` + description(to, true) };
};

/**
 * Presses the given key.
 *
 * Examples:
 * ```
 *  press('Enter')
 *  press('a')
 * ```
 * @param {string} key - Name of key to press, such as ArrowLeft. See [USKeyboardLayout](https://github.com/GoogleChrome/puppeteer/blob/master/lib/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} options.text - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const press = async (key, options) => {
    validate();
    await p.keyboard.press(key, options);
    return { description: `Pressed the ${key} key` };
};

/**
 * Highlights the given element on the page by drawing a red rectangle around it. This is useful for debugging purposes.
 *
 * Examples:
 * ```
 *  highlight('Get Started')
 *  highlight(link('Get Started'))
 * ```
 * @param {selector|string} selector - A selector of an element to highlight. If there are multiple elements satisfying the selector, the first will be highlighted.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const highlight = async selector => {
    validate();
    await evaluate(selector, e => e.style.border = '0.5em solid red');
    return { description: 'Highlighted the ' + description(selector, true) };
};

/**
 * Scrolls the page to the given element.
 *
 * Examples:
 * ```
 *  scrollTo('Get Started')
 *  scrollTo(link('Get Started'))
 * ```
 * @param {selector|string} selector - A selector of an element to scroll to.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const scrollTo = async selector => {
    validate();
    await evaluate(selector, e => e.scrollIntoViewIfNeeded());
    return { description: 'Scrolled to the ' + description(selector, true) };
};

/**
 * Scrolls the page/element to the right.
 *
 * Examples:
 * ```
 *  scrollRight()
 *  scrollRight(1000)
 *  scrollRight('Element containing text')
 *  scrollRight('Element containing text', 1000)
 * ```
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const scrollRight = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(px, 0), (e, px) => e.scrollLeft += px, 'right');
};

/**
 * Scrolls the page/element to the left.
 *
 * Examples:
 * ```
 *  scrollLeft()
 *  scrollLeft(1000)
 *  scrollLeft('Element containing text')
 *  scrollLeft('Element containing text', 1000)
 * ```
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const scrollLeft = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(px * -1, 0), (e, px) => e.scrollLeft -= px, 'left');
};

/**
 * Scrolls up the page/element.
 *
 * Examples:
 * ```
 *  scrollUp()
 *  scrollUp(1000)
 *  scrollUp('Element containing text')
 *  scrollUp('Element containing text', 1000)
 * ```
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const scrollUp = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(0, px * -1), (e, px) => e.scrollTop -= px), 'top';
};

/**
 * Scrolls down the page/element.
 *
 * Examples:
 * ```
 *  scrollDown()
 *  scrollDown(1000)
 *  scrollDown('Element containing text')
 *  scrollDown('Element containing text', 1000)
 * ```
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
const scrollDown = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(0, px), (e, px) => e.scrollTop += px, 'down');
};

/**
 * Captures a screenshot of the page.
 *
 * Examples:
 * ```
 * screenshot({path: 'screenshot.png'});
 * ```
 * @param {Object} options - Options object with properties mentioned [here](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions).
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot.
 */
const screenshot = async options => p.screenshot(options);

/**
 * Lets you identify an element on the web page via XPath or CSS selector.
 *
 * Examples:
 * ```
 * click($('.class'))
 * $('.class').exists()
 * ```
 * @param {string} selector - XPath or CSS selector.
 * @returns {ElementWrapper}
 */
const $ = selector => {
    validate();
    const get = async () => selector.startsWith('//') || selector.startsWith('(') ? $xpath(selector) : p.$(selector);
    return { get: get, exists: exists(get), description: `Custom selector "$(${selector})"` };
};

/**
 * Lets you identify elements on the web page via XPath or CSS selector.
 * ```
 * highlight($$(`//*[text()='text']`)[1])
 * $$(`//*[text()='text']`).exists()
 * ```
 * @param {string} selector - XPath or CSS selector.
 * @returns {ElementWrapper}
 */
const $$ = selector => {
    validate();
    const get = async () => selector.startsWith('//') || selector.startsWith('(') ? $$xpath(selector) : p.$$(selector);
    return { get: get, exists: async () => (await get()).length > 0, description: `Custom selector $$(${selector})` };
};

/**
 * Lets you identify an image (HTML <img> element) on a web page. Typically, this is done via the image's alt text.
 *
 * Examples:
 * ```
 * click(image('alt'))
 * image('alt').exists()
 * ```
 * @param {string} alt - The image's alt text.
 * @returns {ElementWrapper}
 */
const image = alt => {
    validate();
    assertType(alt);
    const get = async () => p.$(`img[alt='${alt}']`);
    return { get: get, exists: exists(get), description: `Image with "alt=${alt}"` };
};

/**
 * Lets you identify a link on a web page.
 *
 * Examples:
 * ```
 * click(link('Get Started'))
 * link('Get Started').exists()
 * ```
 * @param {string} text - The link text.
 * @returns {ElementWrapper}
 */
const link = text => {
    validate();
    const get = async () => element(text, 'a');
    return { get: get, exists: exists(get), description: description(text).replace('Element', 'Link') };
};

/**
 * Lets you identify a list item (HTML <li> element) on a web page.
 *
 * Examples:
 * ```
 * highlight(listItem('Get Started'))
 * listItem('Get Started').exists()
 * ```
 * @param {string} label - The label of the list item.
 * @returns {ElementWrapper}
 */
const listItem = text => {
    validate();
    const get = async () => element(text, 'li');
    return { get: get, exists: exists(get), description: description(text).replace('Element', 'List item') };
};

/**
 * Lets you identify a button on a web page.
 *
 * Examples:
 * ```
 * highlight(button('Get Started'))
 * button('Get Started').exists()
 * ```
 * @param {string} label - The button label.
 * @returns {ElementWrapper}
 */
const button = selector => {
    validate();
    const get = async () => element(selector, 'button');
    return { get: get, exists: exists(get), description: description(selector).replace('Element', 'Button') };
};

/**
 * Lets you identify an input field on a web page.
 *
 * Examples:
 * ```
 * focus(inputField('id', 'name'))
 * inputField('id', 'name').exists()
 * ```
 * @param {string} [attribute='value'] - The input field's attribute.
 * @param {string} value - Value of the attribute specified in the first parameter.
 * @returns {ElementWrapper}
 */
const inputField = (attribute = 'value', value) => {
    validate();
    if (!value) {
        value = attribute;
        attribute = 'value';
    }
    assertType(value);
    assertType(attribute);
    const get = async () => p.$(`input[${attribute}='${value}']`);
    return {
        get: get,
        exists: exists(get),
        description: `Input field with "${attribute} = ${value}"`,
        value: async () => p.evaluate(e => e.value, await get()),
    };
};

/**
 * Lets you identify a text field on a web page.
 *
 * Examples:
 * ```
 * focus(textField('Username:'))
 * textField('Username:').exists()
 * ```
 * @param {string} label - The label (human-visible name) of the text field.
 * @returns {ElementWrapper}
 */
const textField = label => {
    validate();
    assertType(label);
    const get = async () => $xpath(`//input[@type='text'][@id=(//label[contains(text(),'${label}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        description: `Text field with label containing "${label}"`,
        value: async () => p.evaluate(e => e.value, await get()),
    };
};

/**
 * Lets you identify a combo box on a web page.
 *
 * Examples:
 * ```
 * comboBox('Vehicle:').select('Car')
 * comboBox('Vehicle:').value()
 * comboBox('Vehicle:').exists()
 * ```
 * @param {string} label - The label (human-visible name) of the combo box.
 * @returns {ElementWrapper}
 */
const comboBox = label => {
    validate();
    assertType(label);
    const get = async () => $xpath(`//select[@id=(//label[contains(text(),'${label}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        description: `Combo box with label containing "${label}"`,
        select: async (value) => {
            const box = await get();
            if (!box) throw new Error('Combo Box not found');
            await p.evaluate((box, value) => {
                Array.from(box.options).filter(o => o.text === value).forEach(o => o.selected = true);
            }, box, value);
        },
        value: async () => p.evaluate(e => e.value, await get()),
    };
};

/**
 * Lets you identify a checkbox on a web page.
 *
 * Examples:
 * ```
 * checkBox('Vehicle').check()
 * checkBox('Vehicle').uncheck()
 * checkBox('Vehicle').isChecked()
 * checkBox('Vehicle').exists()
 * ```
 * @param {string} label - The label (human-visible name) of the check box.
 * @returns {ElementWrapper}
 */
const checkBox = selector => {
    validate();
    assertType(selector);
    const get = async () => $xpath(`//input[@type='checkbox'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        description: `Checkbox with label containing "${selector}"`,
        isChecked: async () => p.evaluate(e => e.checked, await get()),
        check: async () => p.evaluate(e => e.checked = true, await get()),
        uncheck: async () => p.evaluate(e => e.checked = false, await get()),
    };
};

/**
 * Lets you identify a radio button on a web page.
 *
 * Examples:
 * ```
 * radioButton('Vehicle').select()
 * radioButton('Vehicle').deselect()
 * radioButton('Vehicle').isSelected()
 * radioButton('Vehicle').exists()
 * ```
 * @param {string} label - The label (human-visible name) of the radio button.
 * @returns {ElementWrapper}
 */
const radioButton = selector => {
    validate();
    assertType(selector);
    const get = async () => $xpath(`//input[@type='radio'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        description: `Radio button with label containing "${selector}"`,
        isSelected: async () => p.evaluate(e => e.checked, await get()),
        select: async () => p.evaluate(e => e.checked = true, await get()),
        deselect: async () => p.evaluate(e => e.checked = false, await get()),
    };
};

/**
 * Lets you identify an element with text.
 *
 * Examples:
 * ```
 * highlight(text('Vehicle'))
 * text('Vehicle').exists()
 * ```
 * @param {string} text - Text to match.
 * @returns {ElementWrapper}
 */
const text = text => {
    validate();
    assertType(text);
    const get = async (e = '*') => $xpath('//' + e + `[text()='${text}']`);
    return { get: get, exists: exists(get), description: `Element with text "${text}"` };
};

/**
 * Lets you identify an element containing the text.
 *
 * Example:
 * ```
 * contains('Vehicle').exists()
 * ```
 * @param {string} text - Text to match.
 * @returns {ElementWrapper}
 */
const contains = text => {
    validate();
    assertType(text);
    const get = async (e = '*') => {
        const element = await $xpath('//' + e + `[contains(@value,'${text}')]`);
        return element ? element : await $xpath('//' + e + `[contains(text(),'${text}')]`);
    };
    return { get: get, exists: exists(get), description: `Element containing text "${text}"` };
};

/**
 * Lets you perform an operation when an `alert` with given text is shown.
 *
 * Example:
 * ```
 * alert('Message', async alert => await alert.dismiss());
 * ```
 * @param {string} message - Identify alert based on this message.
 * @param {function(alert)} callback - Operation to perform.
 */
const alert = (message, callback) => dialog('alert', message, callback);

/**
 * Lets you perform an operation when a `prompt` with given text is shown.
 *
 * Example:
 * ```
 * prompt('Message', async prompt => await prompt.dismiss());
 * ```
 * @param {string} message - Identify prompt based on this message.
 * @param {function(prompt)} callback - Operation to perform.
 */
const prompt = (message, callback) => dialog('prompt', message, callback);

/**
 * Lets you perform an operation when a `confirm` with given text is shown.
 *
 * Example:
 * ```
 * confirm('Message', async confirm => await confirm.dismiss());
 * ```
 * @param {string} message - Identify confirm based on this message.
 * @param {function(confirm)} callback - Operation to perform.
 */
const confirm = (message, callback) => dialog('confirm', message, callback);

/**
 * Lets you perform an operation when a `beforeunload` with given text is shown.
 *
 * Example:
 * ```
 * beforeunload('Message', async beforeunload => await beforeunload.dismiss());
 * ```
 * @param {string} message - Identify beforeunload based on this message.
 * @param {function(beforeunload)} callback - Operation to perform.
 */
const beforeunload = (message, callback) => dialog('beforeunload', message, callback);

/**
 * Converts seconds to milliseconds.
 *
 * Example:
 * ```
 * link('Plugins').exists(intervalSecs(1))
 * ```
 * @param {number} secs - Seconds to convert.
 * @return {number} - Milliseconds.
 */
const intervalSecs = secs => secs * 1000;

/**
 * Converts seconds to milliseconds.
 *
 * Example:
 * ```
 * link('Plugins').exists(intervalSecs(1), timeoutSecs(10))
 * ```
 * @param {number} secs - Seconds to convert.
 * @return {number} - Milliseconds.
 */
const timeoutSecs = secs => secs * 1000;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * Example:
 * ```
 * click('Get Started', waitForNavigation(false))
 * ```
 * @param {boolean}
 * @return {boolean}
 */
const waitForNavigation = e => e;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * Example:
 * ```
 * upload('c:/abc.txt', to('Please select a file:'))
 * ```
 * @param {string|Selector}
 * @return {string|Selector}
 */
const to = e => e;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * Example:
 * ```
 * write("user", into('Username:'))
 * ```
 * @param {string|Selector}
 * @return {string|Selector}
 */
const into = e => e;

/**
 * Returns the browser created using `openBrowser`.
 *
 * @returns {Browser} - [Browser](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browser).
 */
const browser = () => {
    validate();
    return b;
};

/**
 * Returns the page instance.
 *
 * @returns {Page} - [Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page).
 */
const page = () => {
    validate();
    return p;
};

const element = async (selector, tag) => {
    const e = await (() => {
        if (isString(selector)) return contains(selector).get(tag);
        else if (isSelector(selector)) return selector.get(tag);
        return null;
    })();
    if (!e) throw new Error('Element not found');
    return e;
};

const description = (selector, lowerCase = false) => {
    const d = (() => {
        if (isString(selector)) return contains(selector).description;
        else if (isSelector(selector)) return selector.description;
        return '';
    })();
    return lowerCase ? d.charAt(0).toLowerCase() + d.slice(1) : d;
};

const _focus = async selector => {
    const e = await element(selector);
    await p.evaluate(e => e.focus(), e);
    return e;
};

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
    e = e || 100;
    if (Number.isInteger(e)) {
        await p.evaluate(scrollPage, e);
        return { description: `Scrolled ${direction} the page by ${px} pixels` };
    }
    await evaluate(e, scrollElement, px);
    return { description: `Scrolled ${direction} ` + description(e, true) + ` by ${px} pixels` };
};

const dialog = (type, message, callback) => {
    validate();
    p.on('dialog', async dialog => {
        if (dialog.type === type && dialog.message() === message)
            await callback(dialog);
    });
};

const isString = obj => typeof obj === 'string' || obj instanceof String;

const isSelector = obj => obj['get'] && obj['exists'];

const $xpath = async selector => {
    const result = await $$xpath(selector);
    return result.length > 0 ? result[0] : null;
};

const $$xpath = async selector => {
    const arrayHandle = await p.mainFrame()._context.evaluateHandle(selector => {
        let result = document.evaluate(selector, document, null, XPathResult.ANY_TYPE, null),
            node = result.iterateNext(),
            results = [];
        while (node) {
            results.push(node);
            node = result.iterateNext();
        }
        return results;
    }, selector);
    const properties = await arrayHandle.getProperties();
    await arrayHandle.dispose();
    const result = [];
    for (const property of properties.values()) {
        const elementHandle = property.asElement();
        if (elementHandle) result.push(elementHandle);
    }
    return result;
};

const validate = () => {
    if (!b || !p) throw new Error('Browser or page not initialized. Call `openBrowser()` before using this API');
};

const assertType = (obj, condition = isString, message = 'String parameter expected') => {
    if (!condition(obj)) throw new Error(message);
};

const sleep = milliseconds => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++)
        if ((new Date().getTime() - start) > milliseconds) break;
};

const exists = get => {
    return async (intervalTime = 1000, timeout = 10000) => {
        try {
            await waitUntil(async () => (await get()) != null, intervalTime, timeout);
            return true;
        } catch (e) {
            return false;
        }
    };
};

const waitUntil = async (condition, intervalTime, timeout) => {
    var start = new Date().getTime();
    while (true) {
        try {
            if (await condition()) break;
        } catch (e) {}
        if ((new Date().getTime() - start) > timeout)
            throw new Error(`waiting failed: timeout ${timeout}ms exceeded`);
        sleep(intervalTime);
    }
};

const evaluate = async (selector, callback, ...args) => {
    const e = await element(selector);
    await p.evaluate(callback, e, ...args);
    await e.dispose();
};

module.exports = {
    browser,
    page,
    openBrowser,
    closeBrowser,
    goto,
    reload,
    $,
    $$,
    link,
    listItem,
    inputField,
    textField,
    image,
    button,
    comboBox,
    checkBox,
    radioButton,
    alert,
    prompt,
    confirm,
    beforeunload,
    text,
    contains,
    click,
    doubleClick,
    rightClick,
    write,
    press,
    upload,
    highlight,
    focus,
    scrollTo,
    scrollRight,
    scrollLeft,
    scrollUp,
    scrollDown,
    hover,
    screenshot,
    timeoutSecs,
    intervalSecs,
    waitForNavigation,
    to,
    into,
};

/**
 * Identifies an element on the page.
 *
 * Example:
 * ```
 * link('Sign in')
 * button('Get Started')
 * $('#id')
 * text('Home')
 * ```
 * @typedef {function(string, ...string)} selector
 */

/**
 * Wrapper object for the element present on the web page.
 * @typedef {Object} ElementWrapper
 * @property {function} get - DOM element getter.
 * @property {exists} exists - Checks existence for element.
 * @property {string} description - Describing the operation performed.
 */

/**
 * @callback exists
 * @param {number} intervalTime - Interval millisecs or use `intervalSecs(secs)`
 * @param {number} timeoutTime - Timeout millisecs or use `timeoutSecs(secs)`
 */

/**
 * Puppeteer's [Browser](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browser) instance.
 * @typedef {Object} Browser
 */

/**
 * Puppeteer's [Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page) instance.
 * @typedef {Object} Page
 */