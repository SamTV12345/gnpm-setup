import {setFailed, saveState, getInput} from '@actions/core'
import {createReadStream, existsSync, symlinkSync, writeFileSync, copyFileSync} from 'node:fs'
import tar from 'tar-fs'
const gnpmPath = '/usr/local/bin/gnpm';

const version = getInput('version', {required: true});


const main = async () => {
    const arch = process.arch === 'x64' ? 'amd64' : process.arch;
    const link = `https://github.com/SamTV12345/gnpm/releases/download/v${version}/gnpm_${version}_${process.platform}_${arch}.tar.gz`
    console.log('Fetching gnpm version from', link);
    const tarFileLocation = "/tmp/gnpm.tar.gz"
    const tarFileTargetLocation = "/tmp/gnpmTarget"
    const actualInstallPath = gnpmPath + `-${version}`

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
            writeFileSync("/tmp/gnpm.tar.gz", buffer, {
                mode: 0o755
            })

           createReadStream(tarFileLocation).pipe(tar.extract(tarFileTargetLocation));

            copyFileSync(`${tarFileTargetLocation}/gnpm`, actualInstallPath);

        } catch (err: any) {
            setFailed(`Failed to fetch gnpm version ${version}. Please check if the version exists. ${err.toString()}`);
        }
        try {
            symlinkSync(actualInstallPath, gnpmPath)
            console.log(`Successfully installed gnpm version ${version}.`)
        } catch (err: any) {
            setFailed(`Failed to create symlink for gnpm version ${version}.` + err.toString());
        }
    }
}

main().catch(error => {
    setFailed(error.message);
});


