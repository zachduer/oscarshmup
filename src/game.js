const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  health: 100,
  score: 0,
  kills: 0,
  weaponLevel: 0,
};

let isFiring = false;
let baseFireRate = 20;
let fireRate = baseFireRate;
let fireCooldown = 0;

const bullets = [];
const enemies = [];
const enemyBullets = [];

function upgradeWeapon() {
  if (player.weaponLevel < 4) {
    player.weaponLevel++;
    if (player.weaponLevel >= 1) {
      fireRate = 10; // faster firing after first kill
    }
  }
}

function spawnPlayerBullets() {
  if (player.weaponLevel >= 4) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      bullets.push({
        x: player.x,
        y: player.y,
        angle: (Math.PI * 2 * i) / count,
      });
    }
  } else {
    bullets.push({ x: player.x, y: player.y, angle: mouseAngle });
    if (player.weaponLevel >= 2) {
      const spread = (5 * Math.PI) / 180;
      bullets.push({ x: player.x, y: player.y, angle: mouseAngle + spread });
      bullets.push({ x: player.x, y: player.y, angle: mouseAngle - spread });
    }
  }
}

function killEnemy(index) {
  enemies.splice(index, 1);
  player.score += 100;
  player.kills++;
  upgradeWeapon();
  updateHud();
}

function spawnEnemy() {
  const types = ['basic', 'shooter', 'fast', 'spiral'];
  const type = types[Math.floor(Math.random() * types.length)];

  const angle = Math.random() * Math.PI * 2;
  const distance = Math.max(canvas.width, canvas.height) / 2 + 40;
  const x = player.x + Math.cos(angle) * distance;
  const y = player.y + Math.sin(angle) * distance;

  enemies.push({ x, y, type, angle, hp: 3, timer: 0 });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += Math.cos(b.angle) * 10;
    b.y += Math.sin(b.angle) * 10;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
    }
  }
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      enemyBullets.splice(i, 1);
    }
    // Collision with player
    const dx = b.x - player.x;
    const dy = b.y - player.y;
    if (Math.hypot(dx, dy) < player.radius) {
      enemyBullets.splice(i, 1);
      player.health -= 10;
      if (player.health <= 0) gameOver();
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const angleToPlayer = Math.atan2(dy, dx);

    switch (e.type) {
      case 'basic':
        e.x += Math.cos(angleToPlayer) * 2;
        e.y += Math.sin(angleToPlayer) * 2;
        break;
      case 'fast':
        e.x += Math.cos(angleToPlayer) * 4;
        e.y += Math.sin(angleToPlayer) * 4;
        break;
      case 'shooter':
        e.x += Math.cos(angleToPlayer) * 1.5;
        e.y += Math.sin(angleToPlayer) * 1.5;
        e.timer++;
        if (e.timer % 60 === 0) {
          enemyBullets.push({
            x: e.x,
            y: e.y,
            angle: angleToPlayer,
            speed: 5,
          });
        }
        break;
      case 'spiral':
        e.x += Math.cos(angleToPlayer) * 1;
        e.y += Math.sin(angleToPlayer) * 1;
        e.timer++;
        if (e.timer % 30 === 0) {
          for (let j = 0; j < 4; j++) {
            enemyBullets.push({
              x: e.x,
              y: e.y,
              angle: e.timer / 20 + (Math.PI / 2) * j,
              speed: 3,
            });
          }
        }
        break;
    }

    // collision with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.hypot(e.x - b.x, e.y - b.y) < 15) {
        bullets.splice(j, 1);

        if (player.weaponLevel >= 3) {
          const radius = 40;
          for (let k = enemies.length - 1; k >= 0; k--) {
            if (k === i) continue;
            const other = enemies[k];
            if (Math.hypot(other.x - e.x, other.y - e.y) < radius) {
              other.hp--;
              if (other.hp <= 0) {
                killEnemy(k);
                if (k < i) i--;
              }
            }
          }
        }

        e.hp--;
        if (e.hp <= 0) {
          killEnemy(i);
        }
        break;
      }
    }

    // check if reached player
    if (Math.hypot(e.x - player.x, e.y - player.y) < player.radius + 10) {
      enemies.splice(i, 1);
      player.health -= 20;
      updateHud();
      if (player.health <= 0) gameOver();
    }
  }
}

function updateHud() {
  document.getElementById('score').textContent = `Score: ${player.score}`;
  document.getElementById('health').textContent = `Health: ${player.health}`;
}

function gameOver() {
  alert('Game Over! Final Score: ' + player.score);
  window.location.reload();
}

let mouseAngle = 0;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  mouseAngle = Math.atan2(my - player.y, mx - player.x);
});

canvas.addEventListener('mousedown', () => {
  isFiring = true;
});
window.addEventListener('mouseup', () => {
  isFiring = false;
});

setInterval(spawnEnemy, 1000);
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isFiring) {
    fireCooldown--;
    if (fireCooldown <= 0) {
      spawnPlayerBullets();
      fireCooldown = fireRate;
    }
  } else if (fireCooldown > 0) {
    fireCooldown--;
  }

  updateBullets();
  updateEnemies();
  updateEnemyBullets();

  // Draw player
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw bullets
  ctx.fillStyle = 'yellow';
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw enemy bullets
  ctx.fillStyle = 'red';
  for (const b of enemyBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw enemies
  ctx.fillStyle = 'green';
  for (const e of enemies) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(gameLoop);
}

updateHud();
requestAnimationFrame(gameLoop);
