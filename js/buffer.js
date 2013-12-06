function Buffer() {
    /*
      FIFO queue type that lets you check when able to consume the
      right amount of data.

     */

    this.max_buffer_size = 104857600
    this._size = 0
    this.deque = []
}
jstorrent.Buffer = Buffer
Buffer.prototype = {
    add: function(data) {
        this._size = this._size + data.byteLength
        this.deque.push(data)
    },
    consume: function(sz) {
        // returns a single array buffer of size sz
        if (sz > this._size) {
            console.assert(false)
            return false
        }

        var consumed = 0

        var ret = new Uint8Array(sz)
        var curbuf
        // consume from the left

        while (consumed < sz) {
            curbuf = this.deque[0]

            if (consumed + curbuf.byteLength <= sz) {
                // curbuf fits in completely to return buffer
                ret.set( new Uint8Array(curbuf), consumed )
                consumed = consumed + curbuf.byteLength
                this.deque.shift()
            } else {
                // curbuf too big! this will be the last buffer
                var sliceleft = new Uint8Array( curbuf, 0, sz - consumed )
                //console.log('left slice',sliceleft)

                ret.set( sliceleft, consumed )
                // we spliced off data, so set curbuf in deque

                var remainsz = curbuf.byteLength - (sz - consumed)
                var sliceright = new Uint8Array(curbuf, sz - consumed, remainsz)
                //console.log('right slice',sliceright)
                var remain = new Uint8Array(remainsz)
                remain.set(sliceright, 0)
                //console.log('right slice (newbuf)',remain)

                this.deque[0] = remain.buffer
                break
            }
        }
        return ret.buffer
    },
    size: function() {
        return this._size
    }
}


function test_buffer() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    console.assert( b.size() == 4 )
    b.add( new Uint8Array([5,6,7]).buffer )
    console.assert( b.size() == 7 )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    console.assert( b.size() == 12 )
    var data

    data = b.consume(1);
    console.assert(new Uint8Array(data)[0] == 1)
    console.assert( data.byteLength == 1 )

    data = b.consume(1);
    console.assert(new Uint8Array(data)[0] == 2)
    console.assert( data.byteLength == 1 )

    data = b.consume(2);
    console.assert( data.byteLength == 2 )
    console.assert(new Uint8Array(data)[0] == 3)
    console.assert(new Uint8Array(data)[1] == 4)
}

function test_buffer2() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    console.assert( b.size() == 4 )
    b.add( new Uint8Array([5,6,7]).buffer )
    console.assert( b.size() == 7 )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    console.assert( b.size() == 12 )
    var data

    data = b.consume(6);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 6)
    console.assert(adata[0] == 1)
    console.assert(adata[1] == 2)
    console.assert(adata[2] == 3)
    console.assert(adata[3] == 4)
    console.assert(adata[4] == 5)
    console.assert(adata[5] == 6)
}

if (jstorrent.options.run_unit_tests) {
    test_buffer()
    test_buffer2()
}