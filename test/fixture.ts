
import childprocess from 'node:child_process'

function RunSqlFile(path_to_sql_file): Promise<void> {
    return new Promise((resolve, reject) => {
        let sql_process = childprocess.spawn(`psql -d fotodb -f ${path_to_sql_file} --quiet`, { shell: true });
        sql_process.on('exit', () => {
            sql_process.removeAllListeners('error');
            resolve();
        });
        sql_process.on('error', () => {
            reject();
        });
    })
}

async function CleanDB() {
    await RunSqlFile('test/sqls/clean-dummy-data.sql');
}

async function PopulateDbWithDummyData() {
    await RunSqlFile('test/sqls/populate-dummy-data.sql');
}

export const mochaGlobalSetup = async function ()  {
    console.log('populating db with dummy data...');
    await PopulateDbWithDummyData()
}

export const mochaGlobalTeardown = async function() {
    console.log('cleaning up after test...')
    await CleanDB()
}