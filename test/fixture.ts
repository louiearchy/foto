
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
    await RunSqlFile('src/clean-db.sql');
}

async function PopulateDbWithDummyData() {
    await RunSqlFile('test/server/populate-with-data.sql');
}

export const mochaGlobalSetup = async function ()  {
    console.log('cleaning test db');
    await CleanDB()

    console.log('populating db with dummy data...');
    await PopulateDbWithDummyData()
}