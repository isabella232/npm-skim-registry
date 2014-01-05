# npm-mcouch

Like mcouch, but specifically for npm registries.

This moves attachments to the target in manta, but then *also* deletes
them out of the couchdb.  It avoids then deleting them out of manta,
by specifying a `{skip: true}` value for each tarball associated with
a published version.

This results in deleting attachments that don't belong (except for
`favicon.ico` on the `npm` doc, which is a special magical snowflake),
but keeping attachments in Manta if they are needed for a published
version, even as they are removed from couchdb.

You probably don't need this.  It's super niche.  More likely, if
you're even reading this, you want [mcouch](http://npm.im/mcouch).
