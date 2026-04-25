/**
 * pm2 process config for the production droplet.
 *
 * Usage on the server (after `npm run build`):
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup    # follow the printed command to start on boot
 *
 * Memory: 1 GB droplet works for one instance. If we scale up, bump
 * `instances` to 'max' and pm2 will fork one per CPU.
 */
module.exports = {
  apps: [
    {
      name: "mintr",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "768M",
      time: true,
      out_file: "/var/log/mintr/out.log",
      error_file: "/var/log/mintr/err.log",
    },
  ],
};
