
import gulp from 'gulp'
import mocha from 'gulp-mocha'
import ts from 'gulp-typescript'

const tsTestProject = ts.createProject('built/test/tsconfig.json', {
        target: 'ES6',
        allowSyntheticDefaultImports: true,
        moduleResolution: 'nodenext',
        module: 'nodenext'
})

function SecondToMs(second) {
    return second * 1000
}

function build_test() {
    return gulp.src('test/**/*.ts').pipe(tsTestProject()).pipe(gulp.dest('built/test/'))
}

function run_test() {
    return gulp.src('built/test/**/*.js').pipe(mocha({
        timeout: SecondToMs(5)
    }))
}

export const test = gulp.series(build_test, run_test)