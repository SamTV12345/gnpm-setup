import {setFailed, saveState, getInput, addPath} from '@actions/core'
import {createReadStream, existsSync, symlinkSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs'
import tar from 'tar-fs'
import {tmpdir} from "node:os";
import {join, dirname} from "node:path";
let gnpmPath: PathLike;

if (process.platform === 'win32') {
    gnpmPath = 'C:\\gnpm\\gnpm.exe';
    if (!existsSync('C:\\gnpm')) {
        mkdirSync('C:\\gnpm');
    }
    addPath('C:\\gnpm');
} else {
    gnpmPath = '/usr/local/bin/gnpm';
}


import {createGunzip} from 'node:zlib';
import { PathLike } from "fs";

const version = getInput('version', {required: true});

const filename = process.platform === 'win32' ? 'gnpm.exe' : 'gnpm';
const versionedFilename = `gnpm-${version}${process.platform === 'win32' ? '.exe' : ''}`;

const main = async () => {
    const arch = process.arch === 'x64' ? 'amd64' : process.arch;
    const platform = process.platform === 'win32' ? 'windows' : process.platform;
    const link = `https://github.com/SamTV12345/gnpm/releases/download/v${version}/gnpm_${version}_${platform}_${arch}.tar.gz`
    const tarFileLocation = join(tmpdir(), "gnpm.tar.gz")
    const tarFileTargetLocation = join(tmpdir(),"gnpmTarget")
    const actualInstallPath = join(dirname(gnpmPath), versionedFilename);

    if (existsSync(actualInstallPath)) {
        console.log("Using cached gnpm binary")
        saveState('gnpmPath', gnpmPath);
    } else {
        try {
            console.log('Fetching gnpm version from', link);
            const gnpmBinary =  await fetch(link)
            if (!gnpmBinary.ok) {
                setFailed('Failed to fetch gnpm binary. Please check if the version exists.');
                return;
            }
            const arrayBuffer = await gnpmBinary.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            saveState('gnpmPath', gnpmPath);
            writeFileSync(tarFileLocation, buffer, {
                mode: 0o755
            })

           createReadStream(tarFileLocation).pipe(createGunzip()).pipe(tar.extract(tarFileTargetLocation))
               .on('finish', ()=>{
                   console.log('Finished gnpm binary done.')
                   copyFileSync(join(tarFileTargetLocation, filename), actualInstallPath);
                   try {
                       symlinkSync(actualInstallPath, gnpmPath)
                       console.log(`Successfully installed gnpm version ${version}.`)
                   } catch (err: any) {
                       setFailed(`Failed to create symlink for gnpm version ${version}.` + err.toString());
                   }
               });


        } catch (err: any) {
            setFailed(`Failed to fetch gnpm version ${version}. Please check if the version exists. ${err.toString()}`);
        }

    }
}

main().catch(error => {
    setFailed(error.message);
});


