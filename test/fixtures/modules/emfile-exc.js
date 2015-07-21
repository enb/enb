if (!global.__EMFILE_EXC_THROWN) {
    global.__EMFILE_EXC_THROWN = true;
    var e = new Error('EMFILE test error');
    e.code = 'EMFILE';
    throw e;
}
