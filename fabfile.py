#!/usr/bin/env python
# encoding: utf-8

"""Releasing dailymotion-sdk-js

Usage:

    fab prod release               release the HEAD
    fab prod release:GIT_REF       release the GIT_REF

"""

from __future__ import unicode_literals

import os, fnmatch
from datetime import datetime
from fabric.colors import green, blue
from fabric.contrib.files import exists
from fabric.api import *
from fabric.contrib.project import rsync_project
from fabric.decorators import roles
from fabric.operations import require
from fabric.utils import puts
from time import time
from dateutil.tz import tzlocal

env.use_ssh_config = False
env.conf = {
    'project': 'dailymotion-sdk-js',
    'git_ref': 'master',
    'target_dir': '/tmp',
    'make_dir': '/data/web'
}


@task
def prod():
    """Work on the production environment
    """
    env.environment = 'prod'
    env.user = 'jenkins-ci'
    env.conf.update({
        'git_ref': 'prod'
    })
    env.roledefs.update({
        'app': [
            'prov-04.adm.dc3.dailymotion.com'
        ]
    })


@task
def release(ref=None):
    """Perform a release

    Parameters:
    ref -- git reference
    """
    require('environment', provided_by=[prod])
    puts("Release in progress")
    execute(send_file)
    execute(deploy)
    execute(cdn_cache_clear)
    puts(blue('Ready to rock'))


@roles('app')
def send_file():
    put('all.js', env.conf['target_dir'])


@roles('app')
def cdn_cache_clear():
    with cd(env.conf['make_dir']):
        run('echo "http://api.dmcdn.net/all.js" | ec_purge_small')
        run('echo "https://api.dmcdn.net/all.js" | ec_purge_small')


@roles('app')
def deploy():
    with cd(env.conf['make_dir']):
        run('echo "deploy"')

