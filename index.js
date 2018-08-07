const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const qs = require('querystring');
const fs = require('fs');

const URL = process.argv[2] || null;
if(!URL){
    throw new Error('informe a url');
}

const makeHeaders = (cookie) => ({
    'Content-type': 'application/x-www-form-urlencoded',
    'Cookie' : cookie
});

const makeBody = (cpf) => ({
    'cpf': cpf,
    'button': ''
});


const postData = (headers, body) => ({
    method: 'POST',
    headers,
    body
});

const getCookie = (url) => fetch(url)
                           .then( response =>
                               response.headers.get('set-cookie')
                           )

const getPage = (url, cpf) =>
    getCookie(url).then(cookie => {
        const headers = makeHeaders(cookie);
        const body = qs.stringify(makeBody(cpf));
        // console.log(headers, body)
        return fetch(url, postData(headers, body))
                .then( resp => resp.text())
                .then( text => text);
    });


const getTextFile = (filename) => fs.readFileSync(filename, 'utf8');

const garimpador = (txt) => {
    const dom = new JSDOM(txt);
    const doc = dom.window.document;
    let b = doc.getElementById('button3');
    const isValid = b ? b.value == 'ALTERAR DADOS': false;

    if(!isValid) return {}

    const dataset = Array.from(doc.getElementsByTagName('span'));
    const getText = (el) => el.innerHTML;
    const D = dataset.map( d => getText(d));
    return {
        "name": D[0],
        "cpf": D[1],
        "rg": D[2],
        "birthdate": D[3],
        "address": D[4],
        "city_uf": D[5].replace(/\n/g, '--'),
        "tellphones": D[6].replace(/<.+?>/g, ''),
        "main_email": D[7],
        "alternative_email": D[8]
    }
}

/**
 * Extracts json from the referring CPF
 * @param {string} url
 * @param {string} cpf
 * @param {string} [filename]
 * @return {object}
    * */
const extract = (url, cpf, filename) =>
    getPage(url, cpf)
        .then(resp => {
            filename && fs.writeFileSync(filename, resp, 'utf8');
            return garimpador(resp);
        })
let raw_cpf = process.argv[3] || '';
if(raw_cpf == '') console.log('Hey, digita o cpf ai!');
else {
    extract(URL, raw_cpf).then(r => console.log('RESPONSE: ', r));
}
