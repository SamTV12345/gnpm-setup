import {setFailed, saveState, getInput} from '@actions/core'
import {existsSync, writeFileSync} from 'node:fs'

const gnpmPath = '/usr/local/bin/gnpm';

const version = getInput('version', {required: true});


const main = async () => {
    const link = `https://github.com/SamTV12345/gnpm/releases/download/v${version}/gnpm_${version}_${process.platform}_${process.arch}.tar.gz`
    console.log('Fetching gnpm version from', link);

    if (existsSync(gnpmPath)) {
        saveState('gnpmPath', gnpmPath);
    } else {
        try {
            const gnpmBinary =  await fetch(link)
            if (!gnpmBinary.ok) {
                setFailed('Failed to fetch gnpm binary. Please check if the version exists.');
                return;
            }
            const arrayBuffer = await gnpmBinary.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            saveState('gnpmPath', gnpmPath);
            const actualInstallPath = gnpmPath + `-${version}`
            writeFileSync(actualInstallPath, buffer)
        } catch (err) {
            setFailed(`Failed to fetch gnpm version ${version}. Please check if the version exists.`);
        }
    }
}

main().catch(error => {
    setFailed(error.message);
});


