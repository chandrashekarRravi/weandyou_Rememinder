import os

file_path = "c:/Users/chand/Downloads/Projects/Work/AVAIO/Remeber_Calender/src/pages/Dashboard.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_body_section = False
in_footer_strip = False

for line in lines:
    if "import React," in line and "FeedbackPanel" not in "".join(lines[:30]):
        # Inject importing FeedbackPanel near the top if not present
        new_lines.append(line)
        new_lines.append("import FeedbackPanel from '../components/FeedbackPanel';\n")
        continue

    if "{/* Body Section */}" in line:
        in_body_section = True
        new_lines.append(line)
        
        # Inject our massive proper body structure
        body_content = """                                                    <div className="p-6 xl:px-12">
                                                        <div className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 uppercase tracking-wider flex justify-between items-center">
                                                            <span>Iteration {iterIdx + 1}</span>

                                                        </div>

                                                        {(!entry.status || entry.status === 'Pending') ? (
                                                            <div className={`flex flex-col lg:flex-row gap-6 ${prevEntry ? 'justify-between' : ''}`}>

                                                                {/* LEFT COLUMN: Previous Iteration (if any) */}
                                                                {prevEntry && (
                                                                    <div className={`flex-none space-y-4 opacity-75 ${activeFeedbackId === prevEntry._id ? 'lg:w-[28%]' : 'lg:w-[45%]'}`}>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Iteration {iterIdx}</div>
                                                                            <button 
                                                                                onClick={() => setActiveFeedbackId(activeFeedbackId === prevEntry._id ? null : prevEntry._id)} 
                                                                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shadow-sm ${activeFeedbackId === prevEntry._id ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'}`}
                                                                                title="View Feedback"
                                                                            >
                                                                                <FaRegComment className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="w-full bg-gray-100 rounded-lg flex border border-gray-200 overflow-hidden items-center justify-center relative group">
                                                                            {prevEntry.mediaId.startsWith('vid') || prevEntry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                                <video src={prevEntry.filePath} controls className="w-full h-auto block" />
                                                                            ) : (
                                                                                <img
                                                                                    src={prevEntry.filePath}
                                                                                    alt="Previous Iteration"
                                                                                    className="w-full h-auto block cursor-pointer transition-transform hover:scale-[1.02]"
                                                                                    onClick={() => setSelectedImage(prevEntry.filePath)}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <div className="border border-gray-200 rounded-lg p-4 min-h-[10px] bg-gray-50">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Captions</p>
                                                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{prevEntry.caption || 'No caption provided.'}</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* MIDDLE/RIGHT COLUMNS: When Side-by-Side, Feedback becomes middle. 
                                                                    When Single, Current Iteration is Left, Actions Middle, Feedback Box/Button Right */}

                                                                {!prevEntry ? (
                                                                    /* SINGLE ITERATION VIEW (Iter 1) */
                                                                    <>
                                                                        <div className="flex-none lg:w-[30%] space-y-4">
                                                                            <div className="w-full bg-gray-100 rounded-lg flex border border-gray-200 overflow-hidden items-center justify-center relative group">
                                                                                {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                                    <video src={entry.filePath} controls className="w-full h-auto block" />
                                                                                ) : (
                                                                                    <img
                                                                                        src={entry.filePath}
                                                                                        alt="Creative"
                                                                                        className="w-full h-auto block cursor-pointer transition-transform hover:scale-[1.02]"
                                                                                        onClick={() => setSelectedImage(entry.filePath)}
                                                                                    />
                                                                                )}
                                                                                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                                                                                    {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? 'Video' : 'Image'}
                                                                                </div>
                                                                            </div>
                                                                            <div className="border border-gray-200 rounded-lg p-4 min-h-[10px] bg-gray-50">
                                                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Captions</p>
                                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.caption || 'No caption provided.'}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex lg:flex-col items-center justify-center gap-4 lg:py-8 lg:px-2 relative">
                                                                            <button
                                                                                onClick={() => setActiveFeedbackId(activeFeedbackId === entry._id ? null : entry._id)}
                                                                                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-sm ${activeFeedbackId === entry._id ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'}`}
                                                                                title="Feedback"
                                                                            >
                                                                                <FaRegComment className="w-5 h-5" />
                                                                            </button>
                                                                            {user?.role !== 'Team' && user?.role !== 'Client' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleStatusUpdate(entry._id, 'Approved')}
                                                                                        className="w-10 h-10 rounded-full border border-green-300 bg-white flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors shadow-sm" title="Approve">
                                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleStatusUpdate(entry._id, 'Rejected')}
                                                                                        className="w-10 h-10 rounded-full border border-red-300 bg-white flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors shadow-sm" title="Reject">
                                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    /* MULTIPLE ITERATIONS VIEW (Actions moved to Bottom or inside side columns) */
                                                                    <div className="hidden"></div>
                                                                )}

                                                                {/* Shared Right Column (Feedback / Next Button / Current Iter in Side-by-Side) */}
                                                                <div className={`flex-1 flex gap-4 ${prevEntry ? 'lg:flex-row' : ''}`}>
                                                                    {/* Middle COLUMN: Feedback Box for prev or single entry */}
                                                                    {(prevEntry || activeFeedbackId === entry._id) && (
                                                                        <div className={`flex-1 flex max-h-[400px] ${prevEntry ? 'lg:w-[35%]' : ''}`}>
                                                                            <FeedbackPanel 
                                                                                entryId={prevEntry ? prevEntry._id : entry._id} 
                                                                                onFeedbackAdded={() => setLocalFeedbacks(prev => new Set(prev).add(prevEntry ? prevEntry._id : entry._id))} 
                                                                                readOnly={!!prevEntry}
                                                                                showInput={!prevEntry && activeFeedbackId === entry._id}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Right COLUMN: Current Iteration Image OR Buttons */}
                                                                    {prevEntry ? (
                                                                        <div className={`flex-none flex flex-col space-y-4 ${activeFeedbackId === entry._id ? 'lg:w-[28%]' : 'lg:w-[45%]'}`}>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">Iteration {iterIdx + 1}</div>

                                                                                {/* Actions for current iteration in side-by-side mode */}
                                                                                <div className="flex gap-2">
                                                                                    <button 
                                                                                        onClick={() => setActiveFeedbackId(activeFeedbackId === entry._id ? null : entry._id)} 
                                                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shadow-sm ${activeFeedbackId === entry._id ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'}`}
                                                                                        title="Feedback"
                                                                                    >
                                                                                        <FaRegComment className="w-4 h-4" />
                                                                                    </button>
                                                                                    {user?.role !== 'Team' && user?.role !== 'Client' && (
                                                                                        <>
                                                                                            <button onClick={() => handleStatusUpdate(entry._id, 'Approved')} className="w-8 h-8 rounded-full border border-green-300 bg-white flex items-center justify-center text-green-600 hover:bg-green-50 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                                                                                            <button onClick={() => handleStatusUpdate(entry._id, 'Rejected')} className="w-8 h-8 rounded-full border border-red-300 bg-white flex items-center justify-center text-red-600 hover:bg-red-50 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="w-full bg-indigo-50/30 rounded-lg flex border border-indigo-200 overflow-hidden items-center justify-center relative group">
                                                                                {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                                    <video src={entry.filePath} controls className="w-full h-auto block" />
                                                                                ) : (
                                                                                    <img
                                                                                        src={entry.filePath}
                                                                                        alt="Current Iteration"
                                                                                        className="w-full h-auto block cursor-pointer transition-transform hover:scale-[1.02]"
                                                                                        onClick={() => setSelectedImage(entry.filePath)}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <div className="border border-indigo-100 rounded-lg p-4 min-h-[10px] bg-white">
                                                                                <p className="text-xs font-semibold text-indigo-400 uppercase mb-2">Captions</p>
                                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.caption || 'No caption provided.'}</p>
                                                                            </div>
                                                                            
                                                                            {activeFeedbackId === entry._id && (
                                                                                <div className="mt-4 flex-1">
                                                                                    <FeedbackPanel 
                                                                                        entryId={entry._id} 
                                                                                        onFeedbackAdded={() => setLocalFeedbacks(prev => new Set(prev).add(entry._id))} 
                                                                                        readOnly={false}
                                                                                        showInput={true}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        /* Single View right column plus button */
                                                                        user?.role !== 'Client' ? (
                                                                            ((entry.feedbackCount ?? 0) > 0 || localFeedbacks.has(entry._id)) ? (
                                                                                <div className="flex flex-col items-center justify-center min-w-[120px]">
                                                                                    <button
                                                                                        onClick={() => { setModalInitialData({ mediaId: entry.mediaId, clientName, category: entry.category }); setIsModalOpen(true); }}
                                                                                        className="w-16 h-16 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors shrink-0 shadow-sm z-10 bg-white"
                                                                                        title="Accept & Add New Iteration"
                                                                                    >
                                                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                                                                    </button>
                                                                                    <div className="mt-2 text-center text-xs text-gray-500 leading-tight">
                                                                                        After this accept<br />add to new one
                                                                                    </div>
                                                                                </div>
                                                                            ) : <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic h-[200px]">Provide feedback to unlock next iteration</div>
                                                                        ) : null
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col md:flex-row gap-8 items-start justify-center mt-2">
                                                                <div className="flex-1 w-full bg-gray-50 rounded-xl flex border border-gray-200 overflow-hidden items-center justify-center relative p-2 shadow-sm">
                                                                    {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                        <video src={entry.filePath} controls className="w-full max-h-[500px] object-contain block rounded-lg bg-black/5" />
                                                                    ) : (
                                                                        <img
                                                                            src={entry.filePath}
                                                                            alt="Creative"
                                                                            className="w-full max-h-[500px] object-contain block cursor-pointer transition-transform hover:scale-[1.02] rounded-lg"
                                                                            onClick={() => setSelectedImage(entry.filePath)}
                                                                        />
                                                                    )}
                                                                    <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                                                                        {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? 'Video' : 'Image'}
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 w-full bg-white border border-gray-200 shadow-sm rounded-xl p-6 min-h-[100px] flex flex-col">
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3 border-b border-gray-100 pb-2">Caption</p>
                                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed flex-1">
                                                                        {entry.caption || 'No caption provided.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
"""
        new_lines.append(body_content)
        continue

    if "{/* Footer Strip - Iterations */}" in line:
        in_body_section = False
        in_footer_strip = True

    if not in_body_section:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Dashboard rewritten successfully.")
