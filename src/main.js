/* boot the lesson once every module has registered its stages */
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('back').addEventListener('click', () => NL.Lesson.back());
  NL.Lesson.boot();
});
