(function () {
  'use strict';

  var META = document.querySelector('meta[name="codex-guard-token"]');
  var token = (META && META.content) || '';
  var params = new URLSearchParams(location.search);
  var lang = String(params.get('lang') || 'zh').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  var theme = String(params.get('theme') || '');
  if (theme === 'dark' || theme === 'light') document.documentElement.setAttribute('data-theme', theme);

  var words = {
    zh: {
      title: '会话守护',
      subtitle: '盯住 Codex 的登录态文件：被登出清空时一键还原项目与会话归属，并看住 5 小时 / 7 天额度。',
      refresh: '刷新',
      quickSnap: '立刻快照',
      heroRestore: '立即还原登录态',
      reading: '读取中',
      updatedAt: '最后检查',
      healthy: '登录态正常',
      anonymous: '匿名态（已登出）',
      partial: '登录态不完整',
      missing: '找不到状态文件',
      unreadable: '状态文件读不出来',
      keys: '顶层键',
      modeLabel: '判定',
      errorLabel: '错误',
      projects: '项目',
      assignments: '会话归属',
      roots: '工作区根',
      size: '文件大小',
      mtime: '修改时间',
      file: '文件',
      home: '目录',
      none: '无',
      noteHealthy: '项目和会话归属都在，侧边栏会按项目分组显示。',
      noteAnonymous: '这正是「项目全没了」的样子：Codex 登出时把这个文件写成了没有项目的匿名版，连 .bak 一起。会话本身没被删。此处可以恢复最近一次健康快照。',
      notePartial: '有项目映射但不完整，可能是写入过程中读到，刷新一次再看。',
      noteMissing: '这个目录下没有 .codex-global-state.json。若 Codex 装在别处，可用插件选项 codexHome 指定。',
      stateTitle: '登录态',
      snapTitle: '快照与恢复',
      snapNote: '「补回项目」只写回项目清单与会话归属，其它设置一概不动；「整份还原」才会用快照覆盖整个文件。两者都会先把当前文件存进 pre-restore。',
      restore: '整份还原',
      mergeRestore: '补回项目（推荐）',
      fullRestore: '整份还原',
      merged: '已补回项目',
      planText: '将补回 {adds} 个键（覆盖 {replaces} 个），带入 {projects} 个项目、{assign} 条会话归属；当前文件其余 {kept} 项设置保持不动。',
      mergeConfirm: '只把项目清单与会话归属写回，其它设置不动。要继续吗？',
      fullConfirm: '整份还原会用快照覆盖该文件（包括界面偏好与模型选择）。要继续吗？',
      snapshot: '新建快照',
      restoreNow: '立即恢复',
      clearLog: '清空日志',
      snapName: '快照名字（可留空）',
      noSnapshots: '还没有快照，先在登录正常时点「立刻快照」。',
      restored: '已恢复',
      made: '已创建快照',
      unusable: '不可用',
      quotaTitle: 'codex 额度',
      quotaOff: '读不到 magpie 网关的额度接口（网关未开或端口不同）。',
      resets: '重置券',
      remaining: '剩余',
      resetsAt: '重置于',
      providersTitle: '供应商',
      providersNote: '这些是 magpie 里登记的供应商与账号；codex 的两个窗口在上面那张卡片里展开。',
      accounts: '账号',
      metered: '按量 / 无窗口',
      routeTitle: '路由现状',
      noRouting: '读不到 providers.json 里的路由组。',
      affinity: '粘性',
      classifier: '分类器',
      settingsTitle: '配置',
      autoRestore: '发现匿名态时自动恢复',
      gateway: 'magpie 网关',
      intervalLabel: '体检间隔',
      save: '保存配置',
      saved: '配置已保存',
      optionHint: '端口和 Codex 目录来自插件选项；改它们请在 magpie 里调整插件选项后重启 magpie。',
      pathsTitle: '路径',
      portLabel: '服务端口',
      homeLabel: 'Codex 目录',
      backupLabel: '备份目录',
      copy: '复制',
      copied: '已复制',
      copyFail: '复制失败，请手动选择文本',
      aboutTitle: '说明',
      aboutNote: 'Codex 把项目和会话归属写在 .codex-global-state.json 里，并按登录态分两份：登出时写的是没有项目的匿名版（连 .bak 一起），所以侧边栏看起来空了。会话本身从没被删，恢复只是把文件写回去。',
      logCleared: '日志已清空'
    },
    en: {
      title: 'Session guard',
      subtitle: "Watch Codex's account-state file: put the projects and session assignments back after a sign-out wipes them, and keep an eye on the 5-hour and 7-day windows.",
      refresh: 'Refresh',
      quickSnap: 'Snapshot now',
      heroRestore: 'Restore now',
      reading: 'reading',
      updatedAt: 'Checked',
      healthy: 'account state healthy',
      anonymous: 'anonymous (signed out)',
      partial: 'account state incomplete',
      missing: 'state file not found',
      unreadable: 'state file unreadable',
      keys: 'Top-level keys',
      modeLabel: 'Verdict',
      errorLabel: 'Error',
      projects: 'Projects',
      assignments: 'Session assignments',
      roots: 'Workspace roots',
      size: 'File size',
      mtime: 'Modified',
      file: 'File',
      home: 'Folder',
      none: 'none',
      noteHealthy: 'Projects and assignments are here; the sidebar groups sessions by project.',
      noteAnonymous: "This is exactly what 'all my projects are gone' looks like: a sign-out rewrites this file as an anonymous copy without projects, .bak included. The sessions themselves are not deleted. Restore the last healthy snapshot here.",
      notePartial: 'There are project mappings but the file looks incomplete; refresh once more.',
      noteMissing: 'No .codex-global-state.json in this folder. If Codex lives elsewhere, set the codexHome plugin option.',
      stateTitle: 'Account state',
      snapTitle: 'Snapshots and restore',
      snapNote: 'Merge writes back only the project list and session assignments; Full restore replaces the whole file. Both copy the current file into pre-restore first.',
      restore: 'Restore all',
      mergeRestore: 'Bring projects back (recommended)',
      fullRestore: 'Restore whole file',
      merged: 'Projects restored',
      planText: 'Will add {adds} keys (overwrite {replaces}), bringing back {projects} projects and {assign} assignments; the other {kept} settings stay as they are.',
      mergeConfirm: 'Write back only the project list and session assignments, leaving other settings alone. Continue?',
      fullConfirm: 'Restore all replaces the whole file (including UI preferences and model picks). Continue?',
      snapshot: 'New snapshot',
      restoreNow: 'Restore now',
      clearLog: 'Clear log',
      snapName: 'Snapshot name (optional)',
      noSnapshots: 'No snapshot yet. Take one while Codex is signed in.',
      restored: 'Restored',
      made: 'Snapshot taken',
      unusable: 'unusable',
      quotaTitle: 'codex windows',
      quotaOff: "magpie's quota endpoint is not answering (gateway off or another port).",
      resets: 'reset credits',
      remaining: 'remaining',
      resetsAt: 'resets',
      providersTitle: 'Providers',
      providersNote: 'Providers and accounts magpie knows about; the two codex windows are expanded above.',
      accounts: 'accounts',
      metered: 'metered / no window',
      routeTitle: 'Routing in effect',
      noRouting: 'No routing group readable from providers.json.',
      affinity: 'affinity',
      classifier: 'classifier',
      settingsTitle: 'Settings',
      autoRestore: 'Restore automatically when the signed-out state appears',
      gateway: 'magpie gateway',
      intervalLabel: 'Check interval',
      save: 'Save settings',
      saved: 'Settings saved',
      optionHint: 'Port and Codex folder come from plugin options; change them in magpie and restart it.',
      pathsTitle: 'Paths',
      portLabel: 'Service port',
      homeLabel: 'Codex folder',
      backupLabel: 'Backups',
      copy: 'Copy',
      copied: 'Copied',
      copyFail: 'Copy failed; select the text instead',
      aboutTitle: 'About',
      aboutNote: "Codex keeps projects and session assignments in .codex-global-state.json, one version per sign-in state: a sign-out writes an anonymous copy without projects (its .bak too), so the sidebar looks empty. Nothing is deleted; a restore just writes the file back.",
      logCleared: 'Log cleared'
    }
  };
  var t = words[lang] || words.zh;

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t.title;
  Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (each) {
    var key = each.getAttribute('data-i18n');
    if (t[key]) each.textContent = t[key];
  });
  var snapNameInput = document.getElementById('snapName');
  if (snapNameInput) snapNameInput.placeholder = t.snapName;

  function el(id) { return document.getElementById(id); }
  function text(value) { return value === null || value === undefined || value === '' ? t.none : String(value); }
  function num(value) { return typeof value === 'number' ? value.toLocaleString() : t.none; }
  function node(tag, cls, value) {
    var made = document.createElement(tag);
    if (cls) made.className = cls;
    if (value !== undefined && value !== null) made.textContent = String(value);
    return made;
  }
  function when(iso) {
    if (!iso) return t.none;
    var date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-GB', { hour12: false });
  }
  function bytes(value) {
    if (!value) return '0 B';
    if (value < 1024) return value + ' B';
    if (value < 1048576) return (value / 1024).toFixed(1) + ' KB';
    return (value / 1048576).toFixed(2) + ' MB';
  }
  function hueOf(name) {
    var h = 0;
    var said = String(name || '');
    for (var i = 0; i < said.length; i++) h = (h * 31 + said.charCodeAt(i)) % 360;
    return h;
  }
  function providerBadge(name) {
    var badge = node('span', 'pbadge', name || '?');
    badge.style.setProperty('--hue', String(hueOf(name)));
    return badge;
  }
  function providerOf(member) {
    var cut = String(member).indexOf('/');
    return cut > 0 ? String(member).slice(0, cut) : String(member);
  }
  function modelOf(member) {
    var cut = String(member).indexOf('/');
    return cut > 0 ? String(member).slice(cut + 1) : String(member);
  }

  function toast(said, bad) {
    var box = el('toast');
    box.textContent = said;
    box.className = bad ? 'toast bad' : 'toast';
    box.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { box.hidden = true; }, bad ? 5200 : 2400);
  }

  function call(path, input) {
    var headers = { 'x-codex-guard-token': token };
    if (input !== undefined) headers['content-type'] = 'application/json';
    return fetch(path, {
      method: input === undefined ? 'GET' : 'POST',
      headers: headers,
      body: input === undefined ? undefined : JSON.stringify(input)
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok || (data && data.ok === false)) {
          throw new Error((data && data.error) || ('HTTP ' + res.status));
        }
        return data;
      });
    });
  }

  var last = null;

  function codexWindows(state) {
    var rows = (state.quota && state.quota.rows) || [];
    var windows = { five: null, week: null, row: null };
    rows.forEach(function (row) {
      if (row.provider !== 'codex') return;
      (row.windows || []).forEach(function (win) {
        var said = String(win.name || '').toLowerCase();
        if (said.indexOf('5') >= 0 && !windows.five) { windows.five = win; windows.row = row; }
        if (said.indexOf('7') >= 0 && !windows.week) { windows.week = win; windows.row = row; }
      });
    });
    return windows;
  }

  function renderHero(state) {
    var codex = state.codex || {};
    var map = { healthy: 'ok', anonymous: 'bad', partial: 'warn', missing: 'warn', unreadable: 'warn' };
    var badge = el('badge');
    badge.className = 'badge ' + (map[codex.mode] || '');
    badge.textContent = t[codex.mode] || codex.mode || t.reading;
    var check = state.settings && state.settings.lastCheck;
    el('heroHint').textContent = check ? t.updatedAt + ' ' + when(check) : '';

    var box = el('pills');
    box.innerHTML = '';
    function pill(label, value, tone) {
      var made = node('span', 'pill' + (tone ? ' ' + tone : ''));
      made.appendChild(document.createTextNode(label + ' '));
      made.appendChild(node('b', '', value));
      box.appendChild(made);
    }
    pill(t.projects, num(codex.projectCount), codex.projectCount > 0 ? 'ok' : 'bad');
    pill(t.assignments, num(codex.assignmentCount));
    var windows = codexWindows(state);
    if (windows.five) {
      var left = windows.five.remaining;
      pill('5h ' + t.remaining, (left === null ? '?' : left) + '%', left !== null && left <= 1 ? 'bad' : left !== null && left <= 15 ? 'warn' : 'ok');
    }
    if (windows.week) {
      var weekLeft = windows.week.remaining;
      pill('7d ' + t.remaining, (weekLeft === null ? '?' : weekLeft) + '%', weekLeft !== null && weekLeft <= 1 ? 'bad' : weekLeft !== null && weekLeft <= 15 ? 'warn' : 'ok');
    }

    var healthy = (state.snapshots || []).filter(function (row) { return row.usable && row.topKeys >= 35; });
    var lost = codex.mode === 'anonymous' || codex.mode === 'partial' || codex.mode === 'missing';
    el('heroRestore').hidden = !(lost && healthy.length);
  }

  function renderState(state) {
    var codex = state.codex || {};
    var note = el('stateNote');
    note.textContent = t['note' + String(codex.mode || '').charAt(0).toUpperCase() + String(codex.mode || '').slice(1)] || '';

    var metrics = el('metrics');
    metrics.innerHTML = '';
    [
      [t.projects, num(codex.projectCount), true],
      [t.assignments, num(codex.assignmentCount), true],
      [t.keys, num(codex.topKeys), true],
      [t.roots, num(codex.workspaceRoots), true]
    ].forEach(function (cell) {
      var made = node('div', 'metric');
      made.appendChild(node('span', 'metric-label', cell[0]));
      made.appendChild(node('span', 'metric-value' + (cell[2] ? '' : ' small'), cell[1]));
      metrics.appendChild(made);
    });

    var list = el('stateList');
    list.innerHTML = '';
    [
      [t.file, text(codex.file)],
      [t.home, text(codex.home)],
      [t.size, bytes(codex.bytes)],
      [t.mtime, when(codex.mtime)],
      [t.modeLabel, text(codex.mode)],
      [t.errorLabel, codex.error || t.none]
    ].forEach(function (pair) {
      list.appendChild(node('dt', '', pair[0]));
      list.appendChild(node('dd', '', pair[1]));
    });
  }

  function renderSnapshots(state) {
    var pick = el('snapPick');
    var rows = state.snapshots || [];
    pick.innerHTML = '';
    if (!rows.length) {
      var empty = document.createElement('option');
      empty.value = '';
      empty.textContent = t.noSnapshots;
      pick.appendChild(empty);
      el('restorePick').disabled = true;
      el('restoreNow').disabled = true;
    } else {
      rows.forEach(function (row) {
        var option = document.createElement('option');
        option.value = row.name;
        option.textContent = row.name + ' · ' + row.topKeys + ' ' + t.keys + ' · ' + row.projectCount + ' ' + t.projects + (row.usable ? '' : ' (' + t.unusable + ')');
        pick.appendChild(option);
      });
      el('restorePick').disabled = !rows.some(function (row) { return row.usable; });
      el('restoreNow').disabled = !rows.some(function (row) { return row.usable && row.topKeys >= 35; });
    }

    var log = el('log');
    log.innerHTML = '';
    var lines = (state.settings && state.settings.log) || [];
    lines.slice(-8).reverse().forEach(function (row) {
      var item = document.createElement('li');
      var stamp = node('time', '', when(row.at));
      item.appendChild(stamp);
      item.appendChild(node('span', '', row.line));
      log.appendChild(item);
    });
  }

  function renderSettings(state) {
    var settings = state.settings || {};
    var auto = el('auto');
    if (document.activeElement !== auto) auto.checked = Boolean(settings.autoRestore);
    var gateway = el('gateway');
    if (document.activeElement !== gateway && !gateway.dataset.dirty) gateway.value = String(settings.gateway || '');

    var service = state.service || {};
    el('pathPort').textContent = service.port ? String(service.port) : t.none;
    el('pathHome').textContent = text((state.codex || {}).home);
    el('pathBackup').textContent = text(service.backupRoot);
  }

  function renderQuota(state) {
    var box = el('quota');
    box.innerHTML = '';
    var quota = state.quota || {};
    var tag = el('quotaTag');
    if (!quota.ok) {
      tag.className = 'tag plain';
      tag.textContent = 'offline';
      box.appendChild(node('p', 'note', t.quotaOff + (quota.error ? ' (' + quota.error + ')' : '')));
      return;
    }
    var rows = (quota.rows || []).filter(function (row) { return row.provider === 'codex'; });
    tag.className = 'tag plain';
    tag.textContent = rows.length + ' ' + t.accounts;
    if (!rows.length) {
      box.appendChild(node('p', 'note', t.none));
      return;
    }
    rows.forEach(function (row) {
      var wrap = node('div', 'q');
      var head = node('div', 'q-head');
      var left = node('div', '');
      left.appendChild(providerBadge(row.provider || 'codex'));
      left.appendChild(document.createTextNode(' '));
      left.appendChild(node('b', '', row.user || row.name || 'codex'));
      head.appendChild(left);
      head.appendChild(node('span', '', (row.plan || '') + (row.resets !== null && row.resets !== undefined ? ' · ' + row.resets + ' ' + t.resets : '')));
      wrap.appendChild(head);
      if (row.error) wrap.appendChild(node('p', 'note', row.error));

      var list = node('div', 'q-windows');
      (row.windows || []).forEach(function (win) {
        var used = typeof win.used === 'number' ? win.used : null;
        var one = node('div', 'win');
        var winHead = node('div', 'win-head');
        winHead.appendChild(node('span', 'name', win.name));
        winHead.appendChild(node('span', 'tail', t.remaining + ' ' + (win.remaining === null || win.remaining === undefined ? '?' : win.remaining) + '% · ' + t.resetsAt + ' ' + when(win.resetsAt)));
        one.appendChild(winHead);
        var track = node('div', 'bar-track');
        var fill = node('div', 'bar-fill' + (used !== null && used >= 99 ? ' low' : used !== null && used >= 90 ? ' mid' : ''));
        fill.style.width = Math.max(0, Math.min(100, used === null ? 0 : used)) + '%';
        track.appendChild(fill);
        one.appendChild(track);
        list.appendChild(one);
      });
      if (!(row.windows || []).length && !row.error) list.appendChild(node('p', 'note tiny', t.metered));
      wrap.appendChild(list);
      box.appendChild(wrap);
    });
  }

  function renderProviders(state) {
    var box = el('providers');
    box.innerHTML = '';
    var rows = (state.quota && state.quota.rows) || [];
    var tag = el('providersTag');
    var names = [];
    rows.forEach(function (row) { if (names.indexOf(row.provider) < 0) names.push(row.provider); });
    tag.className = 'tag plain';
    tag.textContent = names.length + ' ' + t.providersTitle;

    if (!rows.length) {
      box.appendChild(node('p', 'note', t.quotaOff));
      return;
    }
    names.forEach(function (name) {
      var mine = rows.filter(function (row) { return row.provider === name; });
      var wrap = node('div', 'prov');
      var head = node('div', 'prov-head');
      head.appendChild(providerBadge(name));
      head.appendChild(node('span', 'prov-name', (mine[0] && mine[0].name) || name));
      head.appendChild(node('span', 'prov-sub', mine.length + ' ' + t.accounts + (mine[0] && mine[0].plan ? ' · ' + mine[0].plan : '')));
      wrap.appendChild(head);

      var chips = node('div', 'prov-accounts');
      mine.forEach(function (row) {
        var said = row.user || row.plan || row.name || name;
        var windows = (row.windows || []).map(function (win) { return win.name + ' ' + (win.remaining === null || win.remaining === undefined ? '?' : win.remaining) + '%'; });
        var chip = node('span', 'chip', said + (windows.length ? ' · ' + windows.join(' / ') : ''));
        if (row.error) {
          chip.textContent = said + ' · ✕';
          chip.title = row.error;
        }
        chips.appendChild(chip);
      });
      wrap.appendChild(chips);
      var broken = mine.filter(function (row) { return row.error; });
      if (broken.length) {
        wrap.appendChild(node('p', 'note tiny', broken.map(function (row) { return (row.user || row.name) + ': ' + row.error; }).join(' · ')));
      }
      box.appendChild(wrap);
    });
  }

  function renderRouting(state) {
    var box = el('routing');
    box.innerHTML = '';
    var routing = state.routing || {};
    var groups = routing.groups || [];
    var tag = el('routingTag');
    tag.className = 'tag plain';
    tag.textContent = groups.length ? groups.length + ' group' : 'none';
    if (!routing.ok || !groups.length) {
      box.appendChild(node('p', 'note', t.noRouting + (routing.error ? ' (' + routing.error + ')' : '')));
      return;
    }
    groups.forEach(function (group) {
      var wrap = node('div', 'rgroup');
      var head = node('div', 'rgroup-head');
      head.appendChild(node('span', 'rgroup-name', group.name || group.id));
      head.appendChild(node('span', 'tag', group.routing || 'auto'));
      wrap.appendChild(head);

      var meta = node('div', 'rmeta');
      meta.appendChild(node('span', 'tag plain', t.affinity + ' ' + (group.affinity || 'auto')));
      if (group.classifier) meta.appendChild(node('span', 'tag plain', t.classifier + ' ' + group.classifier));
      if (group.rules) meta.appendChild(node('span', 'tag plain', group.rules + ' rules'));
      wrap.appendChild(meta);

      var byProvider = {};
      var order = [];
      (group.members || []).forEach(function (member) {
        var name = providerOf(member);
        if (!byProvider[name]) { byProvider[name] = []; order.push(name); }
        byProvider[name].push(member);
      });
      order.forEach(function (name) {
        var line = node('div', 'prov-line');
        line.appendChild(providerBadge(name));
        var chips = node('div', 'chips');
        byProvider[name].forEach(function (member) { chips.appendChild(node('span', 'chip', modelOf(member))); });
        line.appendChild(chips);
        wrap.appendChild(line);
      });
      box.appendChild(wrap);
    });
  }

  var planHook = null;

  function render(state) {
    last = state;
    renderHero(state);
    renderState(state);
    renderSnapshots(state);
    if (planHook) planHook();
    renderSettings(state);
    renderQuota(state);
    renderProviders(state);
    renderRouting(state);
  }

  function load() {
    return call('/api/state').then(render).catch(function (error) {
      toast(String((error && error.message) || error), true);
    });
  }

  function saveSettings(patch) {
    var input = { autoRestore: el('auto').checked, gateway: el('gateway').value.trim() };
    if (patch) {
      if (typeof patch.autoRestore === 'boolean') input.autoRestore = patch.autoRestore;
      if (typeof patch.clearLog === 'boolean') input.clearLog = true;
    }
    return call('/api/settings', input).then(function (data) {
      if (data && data.state) render(data.state); else load();
      return data;
    });
  }

  function copy(said) {
    if (!said) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(said).then(function () { toast(t.copied); }, function () { toast(t.copyFail, true); });
      return;
    }
    toast(t.copyFail, true);
  }

  function bind() {
    el('refresh').addEventListener('click', function () { load(); });
    if (el('stateReload')) el('stateReload').addEventListener('click', function () { load(); });

    el('heroRestore').addEventListener('click', function () {
      call('/api/restore-now', {}).then(function (data) {
        render(data.state);
        toast(t.restored + ': ' + data.restored.name + ' (' + data.restored.topKeys + ' ' + t.keys + ')');
      }).catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    el('quickSnap').addEventListener('click', function () {
      call('/api/snapshot', {}).then(function (data) {
        render(data.state);
        toast(t.made + ': ' + data.snapshot.name);
      }).catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    el('snapMake').addEventListener('click', function () {
      var name = el('snapName').value.trim();
      call('/api/snapshot', { name: name || undefined }).then(function (data) {
        el('snapName').value = '';
        render(data.state);
        toast(t.made + ': ' + data.snapshot.name);
      }).catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    function restore(name, mode) {
      if (!name) return;
      call('/api/restore', { name: name, mode: mode }).then(function (data) {
        render(data.state);
        var done = data.restored;
        toast((mode === 'full' ? t.restored : t.merged) + ': ' + name + ' (' + (done.projectCount || 0) + ' ' + t.projects + ')');
      }).catch(function (error) { toast(String((error && error.message) || error), true); });
    }

    el('restorePick').addEventListener('click', function () {
      var name = el('snapPick').value;
      if (!name) return;
      if (!window.confirm(t.mergeConfirm)) return;
      restore(name, 'merge');
    });

    el('restoreFull').addEventListener('click', function () {
      var name = el('snapPick').value;
      if (!name) return;
      if (!window.confirm(t.fullConfirm)) return;
      restore(name, 'full');
    });

    el('snapPick').addEventListener('change', function () { showPlan(); });
    planHook = showPlan;

    function showPlan() {
      var name = el('snapPick').value;
      var hint = el('planHint');
      if (!name) { hint.textContent = ''; return; }
      call('/api/plan', { name: name }).then(function (data) {
        var p = data.plan;
        hint.textContent = t.planText
          .replace('{adds}', p.adds.length)
          .replace('{replaces}', p.replaces.length)
          .replace('{projects}', p.snapshotProjects)
          .replace('{assign}', p.snapshotAssignments)
          .replace('{kept}', p.kept);
      }).catch(function () { hint.textContent = ''; });
    }

    el('restoreNow').addEventListener('click', function () {
      call('/api/restore-now', {}).then(function (data) {
        render(data.state);
        toast(t.restored + ': ' + data.restored.name);
      }).catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    el('clearLog').addEventListener('click', function () {
      saveSettings({ clearLog: true }).then(function () { toast(t.logCleared); })
        .catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    el('saveSettings').addEventListener('click', function () {
      saveSettings().then(function () { toast(t.saved); })
        .catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    el('auto').addEventListener('change', function () {
      saveSettings({ autoRestore: el('auto').checked }).then(function () {
        toast(t.autoRestore + ': ' + (el('auto').checked ? 'on' : 'off'));
      }).catch(function (error) { toast(String((error && error.message) || error), true); });
    });

    el('gateway').addEventListener('input', function () {
      el('gateway').dataset.dirty = '1';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (button) {
      button.addEventListener('click', function () {
        var which = button.getAttribute('data-copy');
        if (which === 'home') copy((last && last.codex && last.codex.home) || '');
        if (which === 'backup') copy((last && last.service && last.service.backupRoot) || '');
      });
    });
  }

  bind();
  load();
  setInterval(load, 20000);
})();
