// there is a problem with the options not pass correctly 
const test = require('ava')
const { 
    // defaultOptions,
    // defaultProperties,
    createConfiguration
} = require('../src/options')


test(`It should able to use just one props to overwrite the default props`, t => {

    const config = {
        open: false 
    }
    const options = createConfiguration(config)

    t.is(options.open, false)

})