import CryptoJS from 'react-native-crypto-js';
import isNil from 'lodash/isNil';
import size from 'lodash/size';
import isString from 'lodash/isString';
import get from 'lodash/get';

const secret = 'test';

function generateIv(txt = '') {
  if (!isString(txt)) {
    txt = '';
  }
  const defualtIvString = '1249938r4713478xjd92bdf8ihsfjh83';
  const txtSize = size(txt);
  const subDefualtIvString = defualtIvString.substr(
    0,
    size(defualtIvString) - txtSize,
  );
  const ivString = `${txt}${subDefualtIvString}`;

  return CryptoJS.enc.Hex.parse(ivString);
}

export const encryptText = (txt, salt = secret) => {
  if (isNil(txt)) {
    return '';
  }
  const encrypted = CryptoJS.AES.encrypt(txt, salt).toString();

  return encrypted;
};

export const decryptText = (txt, salt = secret) => {
  if (isNil(txt)) {
    return '';
  }
  const decrypted = CryptoJS.AES.decrypt(txt, salt, {
    iv: generateIv(txt),
  }).toString(CryptoJS.enc.Utf8);

  return decrypted;
};
