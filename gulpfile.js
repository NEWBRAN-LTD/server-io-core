// For testing purposes
const gulp = require('gulp');
const serverIoCore = require('./gulp');

gulp.task('default', async () =>
  gulp.src(['./__tests__/fixtures/demo/dist/base']).pipe(serverIoCore())
);
