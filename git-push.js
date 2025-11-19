// file: git-push.js
const { exec } = require("child_process");
const readline = require("readline");

// Path ke repo lokal
const repoPath = `${process.env.HOME}/.project/golonodesv1`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Masukkan pesan commit: ", (commitMessage) => {
  const gitCommand = `
    cd ${repoPath} &&
    git add . &&
    git commit -m "${commitMessage}" &&
    git push -u golonodesv1 main
  `;

  exec(gitCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      rl.close();
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      rl.close();
      return;
    }
    console.log(`Stdout:\n${stdout}`);
    rl.close();
  });
});
